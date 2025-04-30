import numpy as np
import trimesh
from io import BytesIO

def merge_meshes(meshes):
    """合并多个网格"""
    if not meshes:
        return None
    
    if len(meshes) == 1:
        return meshes[0]
    
    # 合并网格
    merged = trimesh.util.concatenate(meshes)
    return merged

def apply_transform(mesh, translation=None, rotation=None, scale=None):
    """应用变换到网格"""
    if translation is not None:
        mesh.apply_translation(translation)
    
    if rotation is not None:
        # 旋转角度（弧度）
        rotation_radians = np.array(rotation) * (np.pi / 180)
        mesh.apply_transform(trimesh.transformations.euler_matrix(
            rotation_radians[0], rotation_radians[1], rotation_radians[2]
        ))
    
    if scale is not None:
        if isinstance(scale, (int, float)):
            scale = [scale, scale, scale]
        mesh.apply_scale(scale)
    
    return mesh

def export_as_glb(mesh_or_scene):
    """将网格或场景导出为 GLB 二进制数据"""
    # 如果是网格，创建场景
    if isinstance(mesh_or_scene, trimesh.Trimesh):
        scene = trimesh.Scene(mesh_or_scene)
    else:
        scene = mesh_or_scene
    
    # 导出为 GLB
    buffer = BytesIO()
    scene.export(file_obj=buffer, file_type='glb')
    
    # 获取二进制数据
    buffer.seek(0)
    glb_data = buffer.read()
    
    return glb_data
