import numpy as np
import trimesh
from io import BytesIO
import time
from .base_template import BaseTemplate

class BoxTemplate(BaseTemplate):
    """盒子模板实现"""
    
    def __init__(self):
        super().__init__(
            template_id="box",
            name="Box Template",
            description="A simple parametric box model"
        )
    
    def get_parameter_schema(self):
        """返回参数模式"""
        return {
            "width": {
                "type": "number",
                "minimum": 0.1,
                "maximum": 10,
                "default": 1,
                "description": "Width of the box"
            },
            "height": {
                "type": "number",
                "minimum": 0.1,
                "maximum": 10,
                "default": 1,
                "description": "Height of the box"
            },
            "depth": {
                "type": "number",
                "minimum": 0.1,
                "maximum": 10,
                "default": 1,
                "description": "Depth of the box"
            },
            "color": {
                "type": "string",
                "pattern": "^#[0-9A-Fa-f]{6}$",
                "default": "#CCCCCC",
                "description": "Color of the box in hex format"
            }
        }
    
    def generate(self, params):
        """生成盒子模型"""
        # 提取参数
        width = params.get("width", 1)
        height = params.get("height", 1)
        depth = params.get("depth", 1)
        color_hex = params.get("color", "#CCCCCC")
        
        # 创建盒子网格
        box = trimesh.creation.box((width, height, depth))
        
        # 设置颜色
        color_rgb = self._hex_to_rgb(color_hex)
        box.visual.face_colors = color_rgb
        
        # 导出为 GLB
        glb_data = self._export_as_glb(box)
        
        return glb_data
    
    def _hex_to_rgb(self, hex_color):
        """将十六进制颜色转换为 RGB"""
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return [r, g, b, 255]  # RGBA 格式
    
    def _export_as_glb(self, mesh):
        """将网格导出为 GLB 二进制数据"""
        # 创建场景
        scene = trimesh.Scene(mesh)
        
        # 导出为 GLB
        buffer = BytesIO()
        scene.export(file_obj=buffer, file_type='glb')
        
        # 获取二进制数据
        buffer.seek(0)
        glb_data = buffer.read()
        
        return glb_data
