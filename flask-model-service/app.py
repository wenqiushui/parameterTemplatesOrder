from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import os
import json
import time
import logging
from auth import require_auth
from templates import get_template, get_all_templates
from utils.validation import validate_params

app = Flask(__name__)
CORS(app)  # 启用跨域请求

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

@app.route('/generate-model', methods=['POST'])
@require_auth
def generate_model():
    """根据模板和参数生成模型"""
    try:
        # 获取请求数据
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # 验证必要字段
        if 'templateId' not in data or 'params' not in data:
            return jsonify({"error": "Missing required fields: templateId, params"}), 400
        
        template_id = data['templateId']
        params = data['params']
        
        # 获取模板
        template = get_template(template_id)
        if not template:
            return jsonify({"error": f"Template not found: {template_id}"}), 404
        
        # 验证参数
        validation_result = validate_params(params, template.get_parameter_schema())
        if not validation_result['valid']:
            return jsonify({"error": f"Invalid parameters: {validation_result['errors']}"}), 400
        
        # 生成模型
        logger.info(f"Generating model for template {template_id} with params: {json.dumps(params)}")
        start_time = time.time()
        model_data = template.generate(params)
        generation_time = time.time() - start_time
        logger.info(f"Model generation completed in {generation_time:.2f} seconds")
        
        # 返回模型数据
        return model_data, 200, {
            'Content-Type': 'model/gltf-binary',
            'Content-Disposition': f'attachment; filename="{template_id}_{int(time.time())}.glb"'
        }
        
    except Exception as e:
        logger.exception("Error generating model")
        return jsonify({"error": str(e)}), 500

@app.route('/templates/<template_id>/schema', methods=['GET'])
@require_auth
def get_template_schema(template_id):
    """获取模板参数模式"""
    template = get_template(template_id)
    if not template:
        return jsonify({"error": f"Template not found: {template_id}"}), 404
    
    return jsonify(template.get_parameter_schema())

@app.route('/templates', methods=['GET'])
@require_auth
def list_templates():
    """列出所有可用模板"""
    templates = get_all_templates()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'description': t.description,
        'hasSchema': bool(t.get_parameter_schema())
    } for t in templates])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('DEBUG', 'False').lower() == 'true')
