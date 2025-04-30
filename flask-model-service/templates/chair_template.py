import numpy as np
import trimesh
from io import BytesIO
import time
from .base_template import BaseTemplate

class ChairTemplate(BaseTemplate):
    """椅子模板实现"""
    
    def __init__(self):
        super().__init__(
            template_id="chair",
            name="Chair Template",
            description="A parametric chair model"
        )
    
    def get_parameter_schema(self):
        """返回参数模式"""
        return {
            "seat_width": {
                "type": "number",
                "minimum": 0.3,
                "maximum": 2,
                "default": 0.5,
                "description": "Width of the seat"
            },
            "seat_depth": {
                "type": "number",
                "minimum": 0.3,
                "maximum": 2,
                "default": 0.5,
                "description": "Depth of the seat"
            },
            "seat_height": {
                "type": "number",
                "minimum": 0.3,
                "maximum": 1,
                "default": 0.45,
                "description": "Height of the seat"
            },
            "back_height": {
                "type": "number",
                "minimum": 0.3,
                "maximum": 2,
                "default": 0.8,
                "description": "Height of the backrest"
            },
            "leg_radius": {
                "type": "number",
                "minimum": 0.01,
                "maximum": 0.1,
                "default": 0.025,
                "description": "Radius of the chair legs"
            },
            "seat_color": {
                "type": "string",
                "pattern": "^#[0-9A-Fa-f]{6}$",
                "default": "#8B4513",
                "description": "Color of the seat in hex format"
            },
            "leg_color": {
                "type": "string",
                "pattern": "^#[0-9A-Fa-f]{6}$",
                "default": "#5C4033",
                "description": "Color of the legs in hex format"
            }
        }
    
    def generate(self, params):
        """生成椅子模型"""
        # 提取参数
        seat_width = params.get("seat_width", 0.5)
        seat_depth = params.get("seat_depth", 0.5)
        seat_height = params.get("seat_height", 0.45)
        back_height = params.get("back_height", 0.8)
        leg_radius = params.get("leg_radius", 0.025)
        seat_color_hex = params.get("seat_color", "#8B4513")
        leg_color_hex = params.get("leg_color", "#5C4033")
        
        # 转换颜色
        seat_color = self._hex_to_rgb(seat_color_hex)
        leg_color = self._hex_to_rgb(leg_color_hex)
        
        # 创建座位
        seat = trimesh.creation.box((seat_width, seat_depth, 0.05))
        seat.apply_translation([0, 0, seat_height - 0.025])
        seat.visual.face_colors = seat_color
        
        # 创建靠背
        backrest = trimesh.creation.box((seat_width, 0.05, back_height))
        backrest.apply_translation([0, seat_depth/2 - 0.025, seat_height + back_height/2])
        backrest.visual.face_colors = seat_color
        
        # 创建腿
        legs = []
        leg_positions = [
            [seat_width/2 - leg_radius, seat_depth/2 - leg_radius, 0],
            [seat_width/2 - leg_radius, -seat_depth/2 + leg_radius, 0],
            [-seat_width/2 + leg_radius, seat_depth/2 - leg_radius, 0],
            [-seat_width/2 + leg_radius, -seat_depth/2 + leg_radius, 0]
        ]
        
        for pos in leg_positions:
            leg = trimesh.creation.cylinder(radius=leg_radius, height=seat_height)
            leg.apply_translation([pos[0], pos[1], seat_height/2])
            leg.visual.face_colors = leg_color
            legs.append(leg)
        
        # 合并所有部件
        chair_parts = [seat, backrest] + legs
        chair = trimesh.util.concatenate(chair_parts)
        
        # 导出为 GLB
        glb_data = self._export_as_glb(chair)
        
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
