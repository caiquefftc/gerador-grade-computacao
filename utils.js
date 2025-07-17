import { DADOS_CURSO } from './materias.js';

export function findMateriaById(materiaId) {
    for (const periodo in DADOS_CURSO) {
        // Procura a matéria no array do período atual
        const materia = DADOS_CURSO[periodo].find(m => m.id === materiaId);
        
        // Se encontrar, retorna imediatamente
        if (materia) return materia;
    }
    
    // Se o loop terminar e não encontrar nada, retorna null
    return null;
}