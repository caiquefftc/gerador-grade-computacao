import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

export async function gerarPlanoOtimizado() {
    // A função interna não precisa mais ser async
    // A lógica de planejamento continua a mesma...
    const materiasConcluidasSet = new Set();
    let creditosConcluidos = 0;
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        const materiaId = chk.dataset.materiaId;
        materiasConcluidasSet.add(materiaId);
        const materia = findMateriaById(materiaId);
        if (materia) {
            creditosConcluidos += materia.creditos;
        }
    });

    let materiasPendentes = getMateriasPendentes();
    materiasPendentes = ordenarMateriasPorPrioridade(materiasPendentes);
    const planoGerado = [];
    
    const hoje = new Date();
    let anoAtual = hoje.getFullYear();
    let semestreN = (hoje.getMonth() + 1 <= 7) ? 2 : 1;
    if (semestreN === 1) anoAtual++;

    let semestreCounter = 0;
    while (materiasPendentes.length > 0) {
        semestreCounter++;
        if (semestreCounter > 20) { throw new Error("O algoritmo excedeu 20 semestres."); }
        const semestreAtual = { nome: `${anoAtual}.${semestreN}`, materiasAlocadas: [] };
        const materiasAlocadasNestePasse = new Set();
        for (let i = 0; i < 2; i++) {
            const listaParaIterar = [...materiasPendentes];
            for (const materia of listaParaIterar) {
                const preReqOk = verificarPreRequisitosCumpridos(materia, materiasConcluidasSet, creditosConcluidos);
                const semConflito = !verificarConflitoDeHorario(materia, semestreAtual.materiasAlocadas);
                if (preReqOk && semConflito) {
                    semestreAtual.materiasAlocadas.push(materia);
                    materiasAlocadasNestePasse.add(materia.id);
                    materiasPendentes = materiasPendentes.filter(m => m.id !== materia.id);
                }
            }
        }
        if (materiasAlocadasNestePasse.size === 0 && materiasPendentes.length > 0) { throw new Error("O algoritmo não conseguiu progredir."); }
        planoGerado.push(semestreAtual);
        semestreAtual.materiasAlocadas.forEach(m => {
            materiasConcluidasSet.add(m.id);
            creditosConcluidos += m.creditos;
        });
        if (semestreN === 2) {
            semestreN = 1;
            anoAtual++;
        } else {
            semestreN = 2;
        }
    }
    
    // AÇÃO FINAL: Apenas retorna o resultado do plano
    return planoGerado;
}

/**
 * Coleta todas as matérias que ainda não foram marcadas como concluídas na interface.
 * @returns {Array} Uma lista de objetos de matéria pendentes, com seu período original e cor.
 */
export function getMateriasPendentes() {
    const materiasPendentes = [];
    const concluidasIds = new Set();

    // Primeiro, encontra todas as que JÁ estão marcadas como concluídas
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        concluidasIds.add(chk.dataset.materiaId);
    });

    // Depois, percorre o DADOS_CURSO para pegar as matérias que NÃO estão na lista de concluídas
    for (const periodo in DADOS_CURSO) {
        if (periodo === 'optativas' || periodo === 'outros') continue;

        DADOS_CURSO[periodo].forEach(materia => {
            if (!concluidasIds.has(materia.id)) {
                const materiaDiv = document.getElementById(materia.id); // Pega o elemento da matéria
                // Adiciona a matéria à lista de pendentes, incluindo seu período e cor
                materiasPendentes.push({ 
                    ...materia, 
                    periodoOriginal: parseInt(periodo),
                    cor: materiaDiv ? materiaDiv.dataset.cor : 'cor-8' // Pega a cor ou usa uma padrão
                });
            }
        });
    }
    return materiasPendentes;
}

/**
 * Ordena la lista de materias pendientes, priorizando las de períodos más antiguos.
 * @param {Array} materias - La lista de materias pendientes.
 * @returns {Array} La lista de materias ordenada.
 */
export function ordenarMateriasPorPrioridade(materias) {
    return materias.sort((a, b) => a.periodoOriginal - b.periodoOriginal);
}

/**
 * Verifica se os pré-requisitos de uma matéria são atendidos por um conjunto de matérias já concluídas.
 * @param {Object} materiaParaVerificar - O objeto da matéria cujos pré-requisitos serão checados.
 * @param {Set} materiasConcluidasIds - Um Set com os IDs das matérias já concluídas.
 * @param {number} creditosConcluidos - O total de créditos concluídos.
 * @returns {boolean} - True se os pré-requisitos forem atendidos, false caso contrário.
 */
export function verificarPreRequisitosCumpridos(materiaParaVerificar, materiasConcluidasIds, creditosConcluidos) {
    const preRequisitos = materiaParaVerificar.preRequisitos;
    
    if (preRequisitos.creditos && creditosConcluidos < preRequisitos.creditos) {
        return false;
    }

    if (preRequisitos.cursos && preRequisitos.cursos.length > 0) {
        for (const cursoId of preRequisitos.cursos) {
            if (!materiasConcluidasIds.has(cursoId)) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Verifica se o horário de uma nova matéria conflita com as matérias já alocadas em um semestre.
 * @param {Object} novaMateria - A matéria a ser adicionada.
 * @param {Array} materiasDoSemestre - As matérias já alocadas no semestre.
 * @returns {boolean} - True se houver conflito, false caso contrário.
 */
export function verificarConflitoDeHorario(novaMateria, materiasDoSemestre) {
    if (!novaMateria.horarios) return false;

    for (const horarioNova of novaMateria.horarios) {
        for (const materiaExistente of materiasDoSemestre) {
            if (!materiaExistente.horarios) continue;
            for (const horarioExistente of materiaExistente.horarios) {
                if (horarioNova.dia === horarioExistente.dia) {
                    const temConflito = horarioNova.slots.some(slot => horarioExistente.slots.includes(slot));
                    if (temConflito) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}