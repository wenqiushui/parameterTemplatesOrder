import jsonschema

def validate_params(params, schema):
    """验证参数是否符合 JSON Schema"""
    try:
        jsonschema.validate(instance=params, schema=schema)
        return {"valid": True}
    except jsonschema.exceptions.ValidationError as e:
        return {
            "valid": False,
            "errors": str(e)
        }
