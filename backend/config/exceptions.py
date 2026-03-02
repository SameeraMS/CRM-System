from rest_framework.views import exception_handler
from rest_framework.response import Response


def _format_validation_errors(data):
    """Turn DRF field errors into a single user-friendly message (e.g. 'Email: Already exists. — Phone: Must be 8-15 digits.')."""
    if not isinstance(data, dict):
        return str(data)
    # Single 'detail' string (e.g. from permission denied)
    if 'detail' in data and len(data) == 1:
        detail = data['detail']
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and detail:
            return ' '.join(str(x) for x in detail)
    # Field errors: { "email": ["message"], "phone": ["message"] }
    parts = []
    for key, value in data.items():
        label = key.replace('_', ' ').strip().title()
        if isinstance(value, list) and value:
            parts.append(f"{label}: {' '.join(str(m) for m in value)}")
        elif isinstance(value, str):
            parts.append(f"{label}: {value}")
    if parts:
        return ' — '.join(parts)
    return str(data)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        data = response.data
        if isinstance(data, dict):
            # Validation errors: field names as keys (email, phone, full_name, etc.)
            has_field_errors = any(k != 'detail' for k in data)
            if has_field_errors:
                message = _format_validation_errors(data)
            else:
                detail = data.get('detail')
                if isinstance(detail, str):
                    message = detail
                elif isinstance(detail, list) and detail:
                    message = ' '.join(str(m) for m in detail)
                else:
                    message = _format_validation_errors(data)
        else:
            message = str(data) if data is not None else 'Request failed.'
        custom = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': message,
            },
            'data': None,
        }
        response.data = custom
    return response
