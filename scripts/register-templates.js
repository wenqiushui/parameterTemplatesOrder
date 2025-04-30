const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerTemplates() {
  try {
    // 检查 chair 模板是否已存在
    const existingChair = await prisma.template.findUnique({
      where: { id: 'chair' }
    });

    if (!existingChair) {
      // 创建 chair 模板
      await prisma.template.create({
        data: {
          id: 'chair',
          name: 'Chair Template',
          description: 'A parametric chair model with customizable dimensions',
          isExternal: false,
          parameterSchema: JSON.stringify({
            seatWidth: {
              type: 'number',
              required: true,
              min: 0.3,
              max: 2.0,
              default: 0.5,
              description: 'Width of the seat'
            },
            seatDepth: {
              type: 'number',
              required: true,
              min: 0.3,
              max: 2.0,
              default: 0.5,
              description: 'Depth of the seat'
            },
            seatHeight: {
              type: 'number',
              required: true,
              min: 0.3,
              max: 1.0,
              default: 0.45,
              description: 'Height of the seat from the ground'
            },
            backHeight: {
              type: 'number',
              required: true,
              min: 0.3,
              max: 1.5,
              default: 0.8,
              description: 'Height of the backrest'
            },
            legThickness: {
              type: 'number',
              required: true,
              min: 0.02,
              max: 0.1,
              default: 0.04,
              description: 'Thickness of the chair legs'
            }
          })
        }
      });
      console.log('Chair template registered successfully');
    } else {
      console.log('Chair template already exists');
    }

    // 检查 boxes 模板是否已存在
    const existingBoxes = await prisma.template.findUnique({
      where: { id: 'boxes' }
    });

    if (!existingBoxes) {
      // 创建 boxes 模板
      await prisma.template.create({
        data: {
          id: 'boxes',
          name: 'Boxes Template',
          description: 'A template with multiple customizable boxes',
          isExternal: false,
          parameterSchema: JSON.stringify({
            spacing: {
              type: 'number',
              required: true,
              min: 0,
              max: 10,
              default: 2,
              description: 'Spacing between boxes'
            },
            boxes: {
              type: 'array',
              required: true,
              minItems: 1,
              maxItems: 3,
              default: [
                {
                  width: 1,
                  height: 1,
                  depth: 1,
                  position: [-2, 0, 0],
                  rotation: [0, 0, 0],
                  color: '#ff0000'
                },
                {
                  width: 1,
                  height: 1,
                  depth: 1,
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  color: '#00ff00'
                },
                {
                  width: 1,
                  height: 1,
                  depth: 1,
                  position: [2, 0, 0],
                  rotation: [0, 0, 0],
                  color: '#0000ff'
                }
              ],
              description: 'Array of box configurations'
            }
          })
        }
      });
      console.log('Boxes template registered successfully');
    } else {
      console.log('Boxes template already exists');
    }

    console.log('All templates registered successfully');
  } catch (error) {
    console.error('Error registering templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerTemplates();
