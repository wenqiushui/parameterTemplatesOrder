from flask import request, jsonify
from functools import wraps
import os
import time
import hmac
import hashlib

# API 密钥，应从环境变量获取
API_KEY = os.environ.get('API_KEY', 'development_key')

def require_auth(f):
    """验证请求的认证信息"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        # 检查 Authorization 头
        if not auth_header:
            return jsonify({"error": "Authorization header is required"}), 401
        
        # 验证 Bearer token
        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) != 2:
            return jsonify({"error": "Authorization header must be 'Bearer {token}'"}), 401
        
        token = parts[1]
        
        # 简单的 API 密钥验证
        if token != API_KEY:
            return jsonify({"error": "Invalid API key"}), 401
        
        return f(*args, **kwargs)
    
    return decorated
