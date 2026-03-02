import re
from rest_framework import serializers
from .models import Contact


def validate_phone(value):
    if not value or not str(value).strip():
        return value
    digits = re.sub(r'\D', '', str(value))
    if len(digits) < 8 or len(digits) > 15:
        raise serializers.ValidationError('Must be 8–15 digits.')
    return value


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'full_name', 'email', 'phone', 'role',
            'company', 'organization', 'is_deleted', 'created',
        ]
        read_only_fields = ['id', 'organization', 'created']
        extra_kwargs = {
            'full_name': {'required': True, 'allow_blank': False},
            'email': {'required': True},
            'phone': {'required': False, 'allow_blank': True},
            'role': {'required': False, 'allow_blank': True},
            'company': {'required': False},  # Set by view for nested create: POST /companies/<id>/contacts/
        }

    def validate_email(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('Email is required.')
        company = self.context.get('company') or (self.instance.company if self.instance else None)
        if not company:
            return value
        qs = Contact.objects.filter(company=company, email=value, is_deleted=False)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A contact with this email already exists in this company.')
        return value

    def validate_phone(self, value):
        return validate_phone(value)


class ContactCreateUpdateSerializer(ContactSerializer):
    pass
