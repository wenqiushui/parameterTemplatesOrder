import os

# 应用配置
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
PORT = int(os.environ.get('PORT', 5000))

# 安全配置
API_KEY = os.environ.get('API_KEY', 'development_key')

# 模型生成配置
MAX_GENERATION_TIME = int(os.environ.get('MAX_GENERATION_TIME', 60))  # 秒
