from abc import ABC, abstractmethod

class BaseTemplate(ABC):
    """模板基类，定义所有模板必须实现的接口"""
    
    def __init__(self, template_id, name, description=""):
        self.id = template_id
        self.name = name
        self.description = description
    
    @abstractmethod
    def get_parameter_schema(self):
        """返回模板参数的 JSON Schema"""
        pass
    
    @abstractmethod
    def generate(self, params):
        """根据参数生成模型，返回 GLB 二进制数据"""
        pass
    
    def validate_params(self, params):
        """验证参数是否符合模式"""
        from utils.validation import validate_params
        return validate_params(params, self.get_parameter_schema())
