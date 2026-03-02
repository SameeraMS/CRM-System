"""S3 and local file storage - uses env vars, signed URLs when S3 enabled."""
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import boto3
from botocore.exceptions import ClientError
import os


def get_storage_backend():
    if getattr(settings, 'USE_S3_STORAGE', False) and getattr(settings, 'AWS_STORAGE_BUCKET_NAME'):
        return S3Storage()
    return LocalStorage()


class LocalStorage:
    """Store files in MEDIA_ROOT; serve via MEDIA_URL."""
    def save(self, name, content):
        return default_storage.save(name, content)

    def url(self, name):
        if not name:
            return None
        return default_storage.url(name)

    def delete(self, name):
        if name and default_storage.exists(name):
            default_storage.delete(name)


class S3Storage:
    """Store in S3; generate signed URLs (no public bucket)."""
    def __init__(self):
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME
        self.region = getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self.region,
        )
        self.expiration = getattr(settings, 'AWS_S3_SIGNED_URL_EXPIRATION', 3600)

    def save(self, name, content):
        if hasattr(content, 'read'):
            body = content.read()
        else:
            body = content
        self.client.put_object(
            Bucket=self.bucket,
            Key=name,
            Body=body,
            ContentType=getattr(content, 'content_type', 'image/jpeg'),
        )
        return name

    def url(self, name):
        if not name:
            return None
        try:
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': name},
                ExpiresIn=self.expiration,
            )
        except ClientError:
            return None

    def delete(self, name):
        if not name:
            return
        try:
            self.client.delete_object(Bucket=self.bucket, Key=name)
        except ClientError:
            pass
