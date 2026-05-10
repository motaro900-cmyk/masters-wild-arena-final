import { IBone } from '../../store/useDebugStore';

interface Transform { x: number; y: number; rotation: number; }

/**
 * Рекурсивное вычисление глобальной позиции и угла кости на основе иерархии (Parent-Child).
 */
export const getGlobalTransform = (bones: IBone[], boneId: string): Transform => {
    const bone = bones.find(b => b.id === boneId);
    if (!bone) return { x: 0, y: 0, rotation: 0 };
    
    if (!bone.parentId) {
        return { x: bone.position.x, y: bone.position.y, rotation: bone.rotation };
    }

    const parentTransform = getGlobalTransform(bones, bone.parentId);
    const globalRotation = parentTransform.rotation + bone.rotation;
    
    // Поворачиваем локальную позицию на глобальный угол родителя (Skinning Math)
    const rad = parentTransform.rotation * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const gx = parentTransform.x + (bone.position.x * cos - bone.position.y * sin);
    const gy = parentTransform.y + (bone.position.x * sin + bone.position.y * cos);

    return { x: gx, y: gy, rotation: globalRotation };
};

/**
 * Алгоритм Inverse Kinematics: CCD (Cyclic Coordinate Descent) для 2D.
 * Заставляет "руку" тянуться к `targetX` / `targetY`.
 */
export const solveCCD = (bones: IBone[], effectorId: string, targetX: number, targetY: number, iterations = 10): IBone[] => {
    const result = JSON.parse(JSON.stringify(bones)) as IBone[]; // Deep copy
    
    // Строим цепь от эффектора до корня
    const chain: string[] = [];
    let current = result.find(b => b.id === effectorId);
    while (current) {
        chain.push(current.id);
        current = result.find(b => b.id === current!.parentId);
    }

    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < chain.length; i++) {
            const boneIndex = result.findIndex(b => b.id === chain[i]);
            if (boneIndex === -1) continue;

            const effectorTrans = getGlobalTransform(result, effectorId);
            const boneTrans = getGlobalTransform(result, chain[i]);
            const effectorLength = result.find(b => b.id === effectorId)?.length || 0;

            const tipX = effectorTrans.x + Math.cos(effectorTrans.rotation * (Math.PI / 180)) * effectorLength;
            const tipY = effectorTrans.y + Math.sin(effectorTrans.rotation * (Math.PI / 180)) * effectorLength;

            const currentAngle = Math.atan2(tipY - boneTrans.y, tipX - boneTrans.x);
            const targetAngle = Math.atan2(targetY - boneTrans.y, targetX - boneTrans.x);
            
            let deltaAngle = (targetAngle - currentAngle) * (180 / Math.PI);
            
            // Нормализация угла
            while (deltaAngle > 180) deltaAngle -= 360;
            while (deltaAngle < -180) deltaAngle += 360;
            
            result[boneIndex].rotation += deltaAngle;
        }
    }
    return result;
};
