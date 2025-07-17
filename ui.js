import { DADOS_CURSO } from './materias.js';
import { HORARIOS_PADRAO, CORES_DISPONIVEIS } from './config.js';
import { findMateriaById } from './utils.js';

export const sidebarContent = document.getElementById('sidebar-content');
export const gradesWrapper = document.getElementById('grades-wrapper');

export let creditosConcluidos = 0;
let totalCreditosObrigatorios = 0;

export let alocacaoCreditos = {};

export function resetarAlocacaoCreditos() {
    alocacaoCreditos = {};
}

export function removerAlocacaoMateria(materiaId) {
    if (alocacaoCreditos[materiaId]) {
        alocacaoCreditos[materiaId]--;
    }
    // Retorna a quantidade de créditos alocados restantes para essa matéria
    return alocacaoCreditos[materiaId] || 0;
}

export function updateAll() { atualizarEstadoPrerequisitos(); atualizarContador(); }

/**
 * [VERSÃO FINAL COM TEXTO EM 2 LINHAS] Cria e retorna um elemento DOM para uma única grade de semestre.
 * Permite que o nome da matéria ocupe até 2 linhas antes de truncar.
 */
export function criarElementoGradeParaPDF(semestre, index) {
    const gradeDiv = document.createElement('div');
    gradeDiv.className = 'periodo-grade-semanal';
    if (index > 0) {
        gradeDiv.style.pageBreakBefore = 'always';
    }

    const gradeHeader = document.createElement('div');
    gradeHeader.className = 'grade-header';
    const titulo = document.createElement('h3');
    titulo.textContent = semestre.nome;
    gradeHeader.appendChild(titulo);

    // Etapa 1: Construir a matriz virtual da grade (lógica inalterada)
    const numSlots = HORARIOS_PADRAO.length;
    const numDias = 5;
    const gradeMatrix = Array(numSlots).fill(null).map(() => Array(numDias).fill(null));

    semestre.materiasAlocadas.forEach(materia => {
        if (!materia.horarios) return;
        materia.horarios.forEach(horario => {
            const diaIndex = horario.dia - 1;
            horario.slots.forEach(slot => {
                if (gradeMatrix[slot] && gradeMatrix[slot][diaIndex] === null) {
                    gradeMatrix[slot][diaIndex] = materia;
                }
            });
        });
    });

    // Etapa 2: Construir o HTML a partir da matriz com as alterações visuais
    const tabela = document.createElement('table');
    tabela.className = 'grade-tabela';
    const diasSemana = ["Horários", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    let tableHTML = `<thead><tr>${diasSemana.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;

    for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
        const horario = HORARIOS_PADRAO[slotIndex];
        if (horario === "INTERVALO") {
            tableHTML += `<tr class="intervalo-row"><td colspan="6">Intervalo</td></tr>`;
            continue;
        }
        
        tableHTML += `<tr><td class="horario">${horario}</td>`;
        for (let diaIndex = 0; diaIndex < numDias; diaIndex++) {
            const materia = gradeMatrix[slotIndex][diaIndex];

            if (materia === null) {
                tableHTML += '<td></td>';
            } else {
                const nomeMateria = materia.nome;
                
                // Estilo para o container colorido
                const divStyle = `height: calc(100% - 2px); margin: 1px; display: flex; justify-content: center; align-items: center; overflow: hidden;`;
                
                // ===== A ALTERAÇÃO ESTÁ AQUI =====
                // Estilo para o texto, permitindo até 2 linhas antes de truncar com "..."
                const spanStyle = `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; text-align: center; font-size: 0.95em; line-height: 1.2; max-height: 2.4em;`;
                
                tableHTML += `<td>
                                <div class="materia-agendada ${materia.cor}" style="${divStyle}">
                                    <span class="materia-nome" style="${spanStyle}">${nomeMateria}</span>
                                </div>
                            </td>`;
            }
        }
        tableHTML += `</tr>`;
    }

    tableHTML += `</tbody>`;
    tabela.innerHTML = tableHTML;

    gradeDiv.append(gradeHeader, tabela);
    return gradeDiv;
}

/**
 * [VERSÃO FINAL E CORRETA - MÉTODO DA PÁGINA ÚNICA]
 * Gera um PDF com múltiplas páginas a partir de um único elemento HTML longo,
 * deixando a biblioteca html2pdf gerenciar a paginação.
 */
export async function exportarPlanoOtimizadoParaPDF(planoGerado) {
    // 1. Cria um container que servirá como nossa "página longa"
    const longPageContainer = document.createElement('div');
    // Definir uma largura ajuda o html2canvas a renderizar de forma consistente
    longPageContainer.style.width = '10.5in'; 

    // 2. Anexa a grade de cada semestre ao container.
    // A função criarElementoGradeParaPDF já adiciona a quebra de página (page-break-before)
    planoGerado.forEach((semestre, index) => {
        const elementoGrade = criarElementoGradeParaPDF(semestre, index);
        longPageContainer.appendChild(elementoGrade);
    });

    // 3. Define as opções, incluindo o modo de quebra de página
    const hoje = new Date();
    const nomeArquivo = `plano_de_estudos_final_${hoje.toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    const opt = {
        margin: 0.25,
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
        // Habilita o modo de quebra de página da biblioteca, que respeitará nosso CSS
        pagebreak: { mode: 'css' }
    };

    // 4. Gera o PDF a partir do container com todas as grades.
    // A biblioteca fará todo o trabalho de paginação para nós.
    // O 'await' garante que a tela de carregamento só suma quando o PDF for salvo.
    await html2pdf().from(longPageContainer).set(opt).save();
}

export function criarMateriaItemDOM(materia, tipo, cor) {
    const materiaItem = document.createElement('div'); materiaItem.className = 'materia-item';
    if (tipo !== 'optativas' && tipo !== 'outros') {
        const materiaCheckbox = document.createElement('input');
        materiaCheckbox.type = 'checkbox'; materiaCheckbox.className = 'materia-checkbox';
        materiaCheckbox.dataset.materiaId = materia.id; materiaCheckbox.dataset.periodoPai = tipo;
        materiaItem.appendChild(materiaCheckbox);
    } else {
        const removerOptativaBtn = document.createElement('span');
        removerOptativaBtn.className = 'remover-custom-btn';
        removerOptativaBtn.innerHTML = '&times;';
        removerOptativaBtn.title = 'Remover este item';
        removerOptativaBtn.dataset.materiaId = materia.id;
        removerOptativaBtn.dataset.tipo = tipo;
        materiaItem.appendChild(removerOptativaBtn);
    }
    const materiaDiv = document.createElement('div'); materiaDiv.className = `materia ${cor}`;
    materiaDiv.id = materia.id; materiaDiv.draggable = true; materiaDiv.textContent = materia.nome; materiaDiv.dataset.cor = cor;
    materiaItem.appendChild(materiaDiv);
    return materiaItem;
}

export function inicializarUI() {
    // O cálculo do total de créditos agora é feito aqui.
    for (const periodo in DADOS_CURSO) {
        if (periodo !== 'optativas' && periodo !== 'outros') {
            DADOS_CURSO[periodo].forEach(materia => {
                totalCreditosObrigatorios += materia.creditos;
            });
        }
    }
}

export function gerarSidebar() {
    sidebarContent.innerHTML = '';
    for (const periodo in DADOS_CURSO) {
        const accordeon = document.createElement('div'); accordeon.className = 'periodo-accordeon';
        const header = document.createElement('div'); header.className = 'periodo-header'; header.dataset.target = `lista-${periodo}`;
        let labelText;
        if(periodo === 'optativas') labelText = 'Optativas';
        else if(periodo === 'outros') labelText = 'Outros Compromissos';
        else labelText = `${periodo}º Período`;
        if (periodo !== 'optativas' && periodo !== 'outros') {
            const periodoCheckbox = document.createElement('input');
            periodoCheckbox.type = 'checkbox'; periodoCheckbox.className = 'periodo-checkbox';
            periodoCheckbox.dataset.periodo = periodo; periodoCheckbox.title = 'Marcar período como concluído';
            header.appendChild(periodoCheckbox);
        }
        const label = document.createElement('span'); label.className = 'periodo-header-label'; label.textContent = labelText;
        const icon = document.createElement('span'); icon.innerHTML = '&#9660;';
        header.append(label, icon);
        const listaContainer = document.createElement('div'); listaContainer.id = `lista-${periodo}`; listaContainer.className = 'lista-materias-container hidden';
        let corIndex = 0;
        DADOS_CURSO[periodo].forEach(m => {
            const corDaMateria = CORES_DISPONIVEIS[corIndex++ % CORES_DISPONIVEIS.length];
            listaContainer.appendChild(criarMateriaItemDOM(m, periodo, corDaMateria));
        });
        if (periodo === 'optativas' || periodo === 'outros') {
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-acao add-custom-btn';
            addBtn.dataset.tipo = periodo;
            addBtn.textContent = periodo === 'optativas' ? '+ Adicionar Optativa' : '+ Adicionar Outro';
            listaContainer.appendChild(addBtn);
        }
        accordeon.append(header, listaContainer);
        sidebarContent.appendChild(accordeon);
    }
}

export function gerarGradePeriodo(nome) {
    const gradeDiv = document.createElement('div');
    gradeDiv.className = 'periodo-grade-semanal';
    const gradeHeader = document.createElement('div');
    gradeHeader.className = 'grade-header';
    const titulo = document.createElement('h3');
    titulo.textContent = nome;
    titulo.contentEditable = true;
    const controlesDiv = document.createElement('div');
    controlesDiv.className = 'controles';
    const limparBtn = document.createElement('button');
    limparBtn.className = 'btn-acao limpar-grade-btn';
    limparBtn.innerHTML = '&#x1F5D1;';
    limparBtn.title = "Limpar grade e progresso";
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-acao export-periodo-pdf-btn';
    exportBtn.textContent = 'Exportar PDF';
    const otimizarBtn = document.createElement('button');
    otimizarBtn.className = 'btn-acao otimizar-grade-btn';
    otimizarBtn.innerHTML = '✨ Gerar Grade Otimizada';
    otimizarBtn.title = 'Gera um plano de estudos otimizado para concluir o curso';
    controlesDiv.append(limparBtn, exportBtn, otimizarBtn);
    gradeHeader.append(titulo, controlesDiv);
    const tabela = document.createElement('table');
    tabela.className = 'grade-tabela';
    const diasSemana = ["Horários", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    let tableHTML = `<thead><tr>${diasSemana.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;
    HORARIOS_PADRAO.forEach((horario, index) => {
        if (horario === "INTERVALO") {
            tableHTML += `<tr class="intervalo-row"><td colspan="6">Intervalo</td></tr>`;
        } else {
            tableHTML += `<tr><td class="horario" data-slot-index="${index}">${horario}</td>${Array(5).fill('<td></td>').join('')}</tr>`;
        }
    });
    tableHTML += `</tbody>`;
    tabela.innerHTML = tableHTML;
    tabela.querySelectorAll('td:not(.horario):not([colspan="6"])').forEach((td, i) => {
        td.classList.add('dropzone');
        const diaIndex = i % 5 + 1;
        const horarioRow = td.parentElement;
        const slotIndex = Array.from(horarioRow.parentElement.children).indexOf(horarioRow);
        td.dataset.dia = diaIndex;
        td.dataset.slot = slotIndex;
    });
    gradeDiv.append(gradeHeader, tabela);
    gradesWrapper.appendChild(gradeDiv);
}

export function agendarMateriaNoSlot(materia, cor, slot) {
    alocacaoCreditos[materia.id] = (alocacaoCreditos[materia.id] || 0) + 1;
    const creditosAlocados = alocacaoCreditos[materia.id];
    const agendada = document.createElement('div');
    agendada.className = `materia-agendada ${cor}`;
    agendada.draggable = true;
    const nomeSpan = document.createElement('span');
    nomeSpan.className = 'materia-nome';
    nomeSpan.textContent = materia.creditos > 1 ? `${materia.nome} (${creditosAlocados}/${materia.creditos})` : materia.nome;
    const removerBtn = document.createElement('span');
    removerBtn.className = 'remover-materia-btn';
    removerBtn.innerHTML = '&times;';
    agendada.append(nomeSpan, removerBtn);
    agendada.dataset.materiaId = materia.id;
    const materiaOriginal = findMateriaById(materia.id);
    if (materiaOriginal && !materia.id.startsWith('opt-') && !materia.id.startsWith('out-')) {
        agendada.dataset.periodoOriginal = materiaOriginal.periodoOriginal;
    }
    document.querySelectorAll(`.materia-agendada[data-materia-id="${materia.id}"]`).forEach(instancia => {
        instancia.querySelector('.materia-nome').textContent = `${materia.nome} (${creditosAlocados}/${materia.creditos})`;
    });
    if (creditosAlocados >= materia.creditos) {
        const sidebarCheckbox = document.querySelector(`.materia-checkbox[data-materia-id="${materia.id}"]`);
        if (sidebarCheckbox && !sidebarCheckbox.checked) sidebarCheckbox.click();
    }
    slot.appendChild(agendada);
}

export function verificarConclusaoPeriodo(periodoId) {
    if (!periodoId || periodoId === 'optativas' || periodoId === 'outros') return;
    const materiasDoPeriodo = document.querySelectorAll(`.materia-checkbox[data-periodo-pai="${periodoId}"]`);
    if (materiasDoPeriodo.length === 0) return;
    const todasConcluidas = Array.from(materiasDoPeriodo).every(chk => chk.checked);
    const checkboxPeriodo = document.querySelector(`.periodo-checkbox[data-periodo="${periodoId}"]`);
    if(!checkboxPeriodo) return;
    const labelPeriodo = checkboxPeriodo.closest('.periodo-header').querySelector('.periodo-header-label');
    checkboxPeriodo.checked = todasConcluidas;
    labelPeriodo.classList.toggle('concluido', todasConcluidas);
}

export function atualizarEstadoPrerequisitos() {
    creditosConcluidos = 0;
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        const materia = findMateriaById(chk.dataset.materiaId);
        if (materia) creditosConcluidos += materia.creditos;
    });
    for (const periodo in DADOS_CURSO) {
        if (periodo === 'optativas' || periodo === 'outros') continue;
        DADOS_CURSO[periodo].forEach(materia => {
            const preRequisitos = materia.preRequisitos; let requisitosCumpridos = true;
            if (preRequisitos.cursos && preRequisitos.cursos.length > 0) {
                for (const preReqId of preRequisitos.cursos) {
                    const preReqCheckbox = document.querySelector(`.materia-checkbox[data-materia-id="${preReqId}"]`);
                    const preReqNaGrade = document.querySelector(`.materia-agendada[data-materia-id="${preReqId}"]`);
                    if ((!preReqCheckbox || !preReqCheckbox.checked) || preReqNaGrade) {
                        requisitosCumpridos = false; break;
                    }
                }
            }
            if (requisitosCumpridos && preRequisitos.creditos) {
                if (creditosConcluidos < preRequisitos.creditos) requisitosCumpridos = false;
            }
            const materiaDiv = document.getElementById(materia.id);
            if(materiaDiv) materiaDiv.classList.toggle('prereq-nao-cumprido', !requisitosCumpridos);
        });
    }
}

export function atualizarContador() {
    const totalCheckbox = document.querySelectorAll('.materia-checkbox').length;
    const concluidas = document.querySelectorAll('.materia-checkbox:checked').length;
    const faltam = totalCheckbox - concluidas;
    const creditosFaltantes = totalCreditosObrigatorios - creditosConcluidos;
    document.getElementById('contador-progresso').innerHTML = `Matérias Cursadas: <strong>${concluidas}</strong> | Faltam: <strong>${faltam}</strong><br>Créditos Concluídos: <strong>${creditosConcluidos}</strong> | Faltam: <strong>${creditosFaltantes}</strong>`;
}

export function exportarGradeParaPDF(gradeElement) {
    const botoes = gradeElement.querySelectorAll('.btn-acao');
    botoes.forEach(b => b.style.visibility = 'hidden');
    
    const titulo = gradeElement.querySelector('h3').textContent || 'periodo';
    const opt = {
        margin: 0.25, filename: `grade-${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().from(gradeElement).set(opt).save().then(() => {
        botoes.forEach(b => b.style.visibility = 'visible');
    });
}