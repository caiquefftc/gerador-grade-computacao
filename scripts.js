import { DADOS_CURSO } from './materias.js';
import { HORARIOS_PADRAO, CORES_DISPONIVEIS } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    
    
    const sidebarContent = document.getElementById('sidebar-content');
    const gradesWrapper = document.getElementById('grades-wrapper');
    let draggedItem = null;
    let creditosConcluidos = 0;
    let totalCreditosObrigatorios = 0;
    let alocacaoCreditos = {};

    //================================================================================
    // INÍCIO DO BLOCO DO ALGORITMO DE OTIMIZAÇÃO
    //================================================================================

    /**
     * Coleta todas as matérias que ainda não foram marcadas como concluídas na interface.
     * @returns {Array} Uma lista de objetos de matéria pendentes, com seu período original e cor.
     */
    function getMateriasPendentes() {
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
    function ordenarMateriasPorPrioridade(materias) {
        return materias.sort((a, b) => a.periodoOriginal - b.periodoOriginal);
    }

    /**
     * Verifica se os pré-requisitos de uma matéria são atendidos por um conjunto de matérias já concluídas.
     * @param {Object} materiaParaVerificar - O objeto da matéria cujos pré-requisitos serão checados.
     * @param {Set} materiasConcluidasIds - Um Set com os IDs das matérias já concluídas.
     * @param {number} creditosConcluidos - O total de créditos concluídos.
     * @returns {boolean} - True se os pré-requisitos forem atendidos, false caso contrário.
     */
    function verificarPreRequisitosCumpridos(materiaParaVerificar, materiasConcluidasIds, creditosConcluidos) {
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
    function verificarConflitoDeHorario(novaMateria, materiasDoSemestre) {
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

    /**
     * [VERSÃO FINAL COM TEXTO EM 2 LINHAS] Cria e retorna um elemento DOM para uma única grade de semestre.
     * Permite que o nome da matéria ocupe até 2 linhas antes de truncar.
     */
    function criarElementoGradeParaPDF(semestre, index) {
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
     * [VERSÃO COM NOMES DINÂMICOS] Função principal que orquestra a geração do plano de estudos otimizado.
     */
    async function gerarPlanoOtimizado() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');

        setTimeout(async () => {
            try {
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
                
                // LÓGICA DE NOMES DE SEMESTRE
                const hoje = new Date();
                let anoAtual = hoje.getFullYear();
                let semestreN = (hoje.getMonth() + 1 <= 7) ? 2 : 1; // Se estamos no 1º semestre, o próximo é o 2º. Se estamos no 2º, o próximo é o 1º do ano que vem.
                if (semestreN === 1) anoAtual++;

                let semestreCounter = 0;
                while (materiasPendentes.length > 0) {
                    semestreCounter++;
                    if (semestreCounter > 20) { throw new Error("O algoritmo excedeu 20 semestres."); }
                    
                    // USA O NOME DINÂMICO
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

                    // INCREMENTA O SEMESTRE PARA A PRÓXIMA ITERAÇÃO
                    if (semestreN === 2) {
                        semestreN = 1;
                        anoAtual++;
                    } else {
                        semestreN = 2;
                    }
                }

                if (planoGerado.length > 0) {
                    await exportarPlanoOtimizadoParaPDF(planoGerado);
                } else {
                    alert("Parabéns! Todas as matérias obrigatórias já foram concluídas.");
                }

            } catch (error) {
                console.error("Erro ao gerar o plano otimizado:", error);
                alert("Ocorreu um erro ao gerar o plano: " + error.message);
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        }, 100);
    }

    //================================================================================
    // FIM DO BLOCO DO ALGORITMO
    //================================================================================

    function findMateriaById(materiaId) { for (const periodo in DADOS_CURSO) { const materia = DADOS_CURSO[periodo].find(m => m.id === materiaId); if (materia) return materia; } return null; }

    function criarMateriaItemDOM(materia, tipo, cor) {
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

    function gerarSidebar() {
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

    function gerarGradePeriodo(nome) {
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

    function agendarMateriaNoSlot(materia, cor, slot) {
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

    function verificarConclusaoPeriodo(periodoId) {
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

    function atualizarEstadoPrerequisitos() {
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

    function atualizarContador() {
        const totalCheckbox = document.querySelectorAll('.materia-checkbox').length;
        const concluidas = document.querySelectorAll('.materia-checkbox:checked').length;
        const faltam = totalCheckbox - concluidas;
        const creditosFaltantes = totalCreditosObrigatorios - creditosConcluidos;
        document.getElementById('contador-progresso').innerHTML = `Matérias Cursadas: <strong>${concluidas}</strong> | Faltam: <strong>${faltam}</strong><br>Créditos Concluídos: <strong>${creditosConcluidos}</strong> | Faltam: <strong>${creditosFaltantes}</strong>`;
    }
    
    function updateAll() { atualizarEstadoPrerequisitos(); atualizarContador(); }

    function handleDrop(e) {
        e.preventDefault();
        const dropzone = e.target.closest('.dropzone');
        if (!dropzone || !draggedItem) return;
        draggedItem.classList.remove('dragging');
        dropzone.classList.remove('drag-over');
        if (dropzone.children.length > 0 && dropzone !== draggedItem.parentElement) { return; }
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const materiaInfo = findMateriaById(data.id);
        if (data.source === 'grid') {
            if (dropzone.children.length === 0) dropzone.appendChild(draggedItem);
        } else {
            const cor = draggedItem.dataset.cor;
            if (materiaInfo && cor) agendarMateriaNoSlot(materiaInfo, cor, dropzone);
        }
    }

    function handleSidebarClick(e) {
        const target = e.target;
        if (target.matches('.add-custom-btn')) {
            const tipo = target.dataset.tipo;
            const nome = prompt(`Digite o nome do novo item para '${tipo}':`);
            if (!nome) return;
            const creditos = parseInt(prompt("Digite a quantidade de créditos:", "4"));
            if (isNaN(creditos) || creditos <= 0) { alert("Quantidade de créditos inválida."); return; }
            const newId = `${tipo.slice(0,3)}-${Date.now()}`;
            const novoItem = { id: newId, nome: nome, creditos: creditos, preRequisitos: {} };
            DADOS_CURSO[tipo].push(novoItem);
            const listaContainer = document.getElementById(`lista-${tipo}`);
            const cor = CORES_DISPONIVEIS[Math.floor(Math.random() * CORES_DISPONIVEIS.length)];
            const novoItemDOM = criarMateriaItemDOM(novoItem, tipo, cor);
            listaContainer.insertBefore(novoItemDOM, target);
            updateAll();
            return;
        }
        if (target.matches('.remover-custom-btn')) {
            const materiaId = target.dataset.materiaId;
            const tipo = target.dataset.tipo;
            if (!materiaId || !tipo) return;
            DADOS_CURSO[tipo] = DADOS_CURSO[tipo].filter(m => m.id !== materiaId);
            target.closest('.materia-item').remove();
            document.querySelectorAll(`.materia-agendada[data-materia-id="${materiaId}"]`).forEach(el => el.remove());
            delete alocacaoCreditos[materiaId];
            updateAll();
            return;
        }
        const header = target.closest('.periodo-header');
        if (header && !target.matches('input[type="checkbox"]')) {
            const content = header.nextElementSibling;
            content.classList.toggle('hidden');
            header.querySelector('span:last-child').innerHTML = content.classList.contains('hidden') ? '&#9660;' : '&#9650;';
        }
        if (target.classList.contains('materia-checkbox')) {
            const materiaDiv = document.getElementById(target.dataset.materiaId);
            if (materiaDiv && materiaDiv.classList.contains('prereq-nao-cumprido') && target.checked) {
                target.checked = false;
                alert("Você não pode marcar esta matéria como concluída pois os pré-requisitos não foram cumpridos.");
                return;
            }
            if(materiaDiv) materiaDiv.classList.toggle('concluida', target.checked);
            verificarConclusaoPeriodo(target.dataset.periodoPai);
            updateAll();
        }
        if (target.classList.contains('periodo-checkbox')) {
            const periodo = target.dataset.periodo;
            const isChecked = target.checked;
            let podeMarcar = true;
            if(isChecked){
                DADOS_CURSO[periodo].forEach(materia => {
                    const materiaDiv = document.getElementById(materia.id);
                    if(materiaDiv && materiaDiv.classList.contains('prereq-nao-cumprido')) podeMarcar = false;
                });
            }
            if(!podeMarcar){
                target.checked = false;
                alert("Não é possível concluir o período pois ele contém matérias com pré-requisitos pendentes.");
                return;
            }
            target.closest('.periodo-header').querySelector('.periodo-header-label').classList.toggle('concluido', isChecked);
            document.querySelectorAll(`[data-periodo-pai="${periodo}"]`).forEach(chk => {
                if (chk.checked !== isChecked) chk.click();
            });
        }
    }
    
    function handleGradeClick(e) {
        const target = e.target;
        
        if (target.closest('.otimizar-grade-btn')) {
            gerarPlanoOtimizado();
            return;
        }

        const limparBtn = target.closest('.limpar-grade-btn');
        if (limparBtn) {
            if (confirm("Você tem certeza que deseja limpar toda a grade e o progresso? Esta ação não pode ser desfeita.")) {
                const gradeContainer = target.closest('.periodo-grade-semanal');
                gradeContainer.querySelectorAll('.materia-agendada').forEach(el => el.remove());
                document.querySelectorAll('.materia-checkbox:checked').forEach(chk => chk.click());
                document.querySelectorAll('.remover-custom-btn').forEach(btn => btn.click());
                alocacaoCreditos = {};
                updateAll();
            }
            return;
        }

        if (target.matches('.export-periodo-pdf-btn')) {
            exportarGradeParaPDF(target.closest('.periodo-grade-semanal'));
            return;
        }

        const removerBtn = target.closest('.remover-materia-btn');
        if (removerBtn) {
            const materiaAgendada = removerBtn.closest('.materia-agendada');
            const materiaId = materiaAgendada.dataset.materiaId;
            const materiaOriginal = findMateriaById(materiaId);
            
            if (alocacaoCreditos[materiaId]) {
                alocacaoCreditos[materiaId]--;
            }
            const creditosAlocados = alocacaoCreditos[materiaId] || 0;
            
            document.querySelectorAll(`.materia-agendada[data-materia-id="${materiaId}"]`).forEach(instancia => {
                if (instancia !== materiaAgendada && materiaOriginal.creditos > 1) {
                    instancia.querySelector('.materia-nome').textContent = `${materiaOriginal.nome} (${creditosAlocados}/${materiaOriginal.creditos})`;
                }
            });

            if (!materiaId.startsWith('opt-') && !materiaId.startsWith('out-') && creditosAlocados < materiaOriginal.creditos) {
                const sidebarCheckbox = document.querySelector(`.materia-checkbox[data-materia-id="${materiaId}"]`);
                if (sidebarCheckbox && sidebarCheckbox.checked) {
                    sidebarCheckbox.click();
                }
            }
            materiaAgendada.remove();
        }
    }
    
    function handleDragStart(e) {
        const target = e.target;
        let data = {};
        if (target.matches('.materia')) {
            const materia = findMateriaById(target.id);
            if (!materia) { e.preventDefault(); return; }
            if ((alocacaoCreditos[materia.id] || 0) >= materia.creditos) {
                alert(`A matéria "${materia.nome}" já foi totalmente alocada na grade.`);
                e.preventDefault(); return;
            }
            if (target.classList.contains('concluida') || target.classList.contains('prereq-nao-cumprido')) {
                e.preventDefault();
                if (target.classList.contains('prereq-nao-cumprido')) {
                    let erros = [];
                    if (materia.preRequisitos.cursos) {
                        materia.preRequisitos.cursos.forEach(preReqId => {
                            const chk = document.querySelector(`.materia-checkbox[data-materia-id="${preReqId}"]`);
                            if (!chk || !chk.checked) erros.push(findMateriaById(preReqId).nome + " (não concluída)");
                            if (document.querySelector(`.materia-agendada[data-materia-id="${preReqId}"]`)) erros.push(findMateriaById(preReqId).nome + " (não pode cursar com pré-requisito no mesmo período)");
                        });
                    }
                    if (materia.preRequisitos.creditos && creditosConcluidos < materia.preRequisitos.creditos) {
                        erros.push(`${materia.preRequisitos.creditos} créditos concluídos (você tem ${creditosConcluidos})`);
                    }
                    if (erros.length > 0) alert(`Pré-requisitos não cumpridos para ${materia.nome}:\n\n- ${[...new Set(erros)].join('\n- ')}`);
                }
                return;
            }
            data = { id: materia.id, source: 'sidebar' };
        } else if (target.matches('.materia-agendada')) {
                data = { id: target.dataset.materiaId, source: 'grid' };
        } else {
            e.preventDefault(); return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        draggedItem = target;
        setTimeout(() => target.classList.add('dragging'), 0);
    }


    function init() {
        for (const periodo in DADOS_CURSO) {
            if (periodo !== 'optativas' && periodo !== 'outros') {
                DADOS_CURSO[periodo].forEach(materia => {
                    totalCreditosObrigatorios += materia.creditos;
                });
            }
        }
        gerarSidebar();
        const hoje = new Date(); const ano = hoje.getFullYear(); const mes = hoje.getMonth() + 1;
        const semestre = (mes >= 1 && mes <= 7) ? 1 : 2;
        gerarGradePeriodo(`${ano}.${semestre}`);
        updateAll();
    }

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', e => { if (draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; });
    gradesWrapper.addEventListener('dragover', e => { e.preventDefault(); const d = e.target.closest('.dropzone'); if (d) d.classList.add('drag-over'); });
    gradesWrapper.addEventListener('dragleave', e => { const d = e.target.closest('.dropzone'); if (d) d.classList.remove('drag-over'); });
    gradesWrapper.addEventListener('drop', handleDrop);
    gradesWrapper.addEventListener('click', handleGradeClick);
    sidebarContent.addEventListener('click', handleSidebarClick);
    
    init();
});