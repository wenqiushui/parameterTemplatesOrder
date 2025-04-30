from .box_template import BoxTemplate
from .chair_template import ChairTemplate
# 导入其他模板...

# 创建模板实例
_templates = {
    "box": BoxTemplate(),
    "chair": ChairTemplate(),
    # 添加其他模板...
}

def get_template(template_id):
    """获取指定 ID 的模板"""
    return _templates.get(template_id)

def get_all_templates():
    """获取所有模板"""
    return list(_templates.values())

def register_template(template):
    """注册新模板"""
    _templates[template.id] = template
