const DADOS_CURSO = {
    "1": [
        { id: '1A', nome: 'Introdução a Engenharia', creditos: 2, pr: '', horarios: "Quinta - 07:00 às 08:40" },
        { id: '1B', nome: 'Administração e Organização Empresarial', creditos: 2, pr: '', horarios: "Segunda - 10:50 às 12:30" },
        { id: '1C', nome: 'Geometria Analítica', creditos: 3, pr: '', horarios: "Terça - 10:50 às 12:30, Terça - 14:00 às 14:50" },
        { id: '1D', nome: 'Pré-Cálculo', creditos: 3, pr: '', horarios: "Quinta - 08:40 às 11:40" },
        { id: '1E', nome: 'Introdução a Ciência da Computação', creditos: 3, pr: '', horarios: "Terça - 07:00 às 09:30" },
        { id: '1F', nome: 'Lógica para Computação', creditos: 3, pr: '', horarios: "Quarta - 07:50 às 10:50" },
        { id: '1G', nome: 'Projeto de Interação', creditos: 2, pr: '', horarios: "Segunda - 08:40 às 10:50" },
        { id: '1H', nome: 'Leitura e Produção de Textos', creditos: 2, pr: '', horarios: "Sexta - 10:50 às 12:30" }
    ],
    "2": [
        { id: '2A', nome: 'Ética Profissional', creditos: 2, pr: '', horarios: "Terça - 10:50 às 12:30" },
        { id: '2B', nome: 'Cálculo a uma Variável', creditos: 5, pr: '1C, 1D', horarios: "Sexta - 07:00 às 09:30, Quinta - 10:50 às 12:30" },
        { id: '2C', nome: 'Álgebra Linear', creditos: 4, pr: '1A, 1C, 1D', horarios: "Quinta - 07:00 às 08:40, Quarta - 07:00 às 08:40" },
        { id: '2D', nome: 'Mecânica Clássica', creditos: 5, pr: '1D', horarios: "Quinta - 08:40 às 10:50, Sexta - 10:00 às 12:30" },
        { id: '2E', nome: 'Estruturas Discretas', creditos: 4, pr: '1D, 1E', horarios: "Quarta - 08:40 às 12:30" },
        { id: '2F', nome: 'Introdução a Programação', creditos: 4, pr: '1E, 1F', horarios: "Terça - 07:00 às 10:50" },
        { id: '2G', nome: 'Introdução a Economia', creditos: 2, pr: '1A', horarios: "Segunda - 08:40 às 10:50" }
    ],
    "3": [
        { id: '3A', nome: 'Introdução a Engenharia Ambiental', creditos: 2, pr: '1A', horarios: "Segunda - 07:00 às 08:40" },
        { id: '3B', nome: 'Cálculo a várias Variáveis', creditos: 5, pr: '2B', horarios: "Quinta - 08:40 às 10:50, Sexta - 10:00 às 12:30" },
        { id: '3C', nome: 'Termodinâmica', creditos: 4, pr: '2B, 2D', horarios: "Quinta - 07:00 às 08:40, Sexta - 07:50 às 09:30" },
        { id: '3D', nome: 'Software Básico', creditos: 4, pr: '2F', horarios: "Terça - 08:40 às 10:50, Quarta - 07:00 às 08:40" },
        { id: '3E', nome: 'Algoritmos e Estruturas de Dados I', creditos: 6, pr: '2E, 2F', horarios: "Segunda - 08:40 às 12:30, Quarta - 10:50 às 12:30" },
        { id: '3F', nome: 'Modelagem de Dados', creditos: 2, pr: '1E', horarios: "Terça - 10:50 às 12:30" },
        { id: '3G', nome: 'Humanidades e Ciências Sociais', creditos: 2, pr: '2A', horarios: "Quarta - 08:40 às 10:50" }
    ],
    "4": [
        { id: '4A', nome: 'Equações Diferenciais Ordinárias I', creditos: 4, pr: '2C, 3B', horarios: "Quarta - 15:40 às 17:20, Quinta - 15:40 às 17:20" },
        { id: '4B', nome: 'Eletromagnetismo', creditos: 5, pr: '2D, 3B', horarios: "Segunda - 14:00 às 17:20" },
        { id: '4C', nome: 'Redes de Computadores I', creditos: 4, pr: '1D, 2F', horarios: "Quarta - 07:00 às 08:40, Quinta - 07:00 às 08:40" },
        { id: '4D', nome: 'Arquitetura de Computadores', creditos: 6, pr: '3D', horarios: "Terça - 08:40 às 10:50, Sexta - 08:40 às 12:30" },
        { id: '4E', nome: 'Algoritmos e Estruturas de Dados II', creditos: 6, pr: '3E', horarios: "Segunda - 08:40 às 12:30, Terça - 10:50 às 12:30" },
        { id: '4F', nome: 'Banco de Dados', creditos: 4, pr: '2F, 3F', horarios: "Segunda - 07:00 às 08:40, Terça - 07:00 às 08:40" }
    ],
    "5": [
        { id: '5A', nome: 'Probabilidade e Estatística', creditos: 3, pr: '2B', horarios: "Segunda - 07:00 às 09:30" },
        { id: '5B', nome: 'Sistemas Operacionais', creditos: 4, pr: '4D', horarios: "Quinta - 10:50 às 12:30, Quarta - 07:00 às 08:40" },
        { id: '5C', nome: 'Redes de Computadores II', creditos: 6, pr: '4C', horarios: "Quinta - 07:00 às 10:50, Sexta - 07:00 às 08:40" },
        { id: '5D', nome: 'Circuitos Lineares', creditos: 4, pr: '4A, 4B', horarios: "Segunda - 11:40 às 12:30, Terça - 10:50 às 12:30" },
        { id: '5E', nome: 'Cálculo Numérico', creditos: 4, pr: '2C, 2F, 3B', horarios: "Segunda - 10:00 às 11:40, Terça - 07:00 às 08:40" },
        { id: '5F', nome: 'Engenharia de Software', creditos: 2, pr: '2F', horarios: "Terça - 10:50 às 12:30" },
        { id: '5G', nome: 'Programação Orientada a Objetos', creditos: 6, pr: '3E', horarios: "Quarta - 08:40 às 10:50, Sexta - 08:40 às 12:30" }
    ],
    "6": [
        { id: '6A', nome: 'Sinais e Sistemas', creditos: 4, pr: '2C, 4A', horarios: "Terça - 08:40 às 10:50, Quinta - 08:40 às 10:50" },
        { id: '6B', nome: 'Ondulatória e Física Moderna', creditos: 4, pr: '2D, 3B', horarios: "Segunda - 10:50 às 12:30, Quarta - 10:50 às 12:30" },
        { id: '6C', nome: 'Servidores de Redes', creditos: 6, pr: '5C', horarios: "Quinta - 10:50 às 12:30, Sexta - 08:40 às 12:30" },
        { id: '6D', nome: 'Lab. de Circuitos Elétricos e Eletrônicos', creditos: 2, pr: '5D', horarios: "Quarta - 14:00 às 15:40" },
        { id: '6E', nome: 'Eletrônica Analógica', creditos: 4, pr: '5D', horarios: "Segunda - 08:40 às 10:50, Terça - 07:00 às 08:40" },
        { id: '6F', nome: 'Linguagens Formais e Autômatos', creditos: 3, pr: '4E', horarios: "Quarta - 07:50 às 10:50" },
        { id: '6G', nome: 'Análise de Algoritmos', creditos: 4, pr: '4E', horarios: "Terça - 10:50 às 12:30, Sexta - 07:00 às 08:40" }
    ],
    "7": [
        { id: '7A', nome: 'Técnicas Digitais', creditos: 6, pr: '6D, 6E', horarios: "Segunda - 08:40 às 11:40, Quarta - 07:50 às 10:50" },
        { id: '7B', nome: 'Programação Linear', creditos: 4, pr: '5E', horarios: "Segunda - 07:00 às 08:40, Terça - 08:40 às 10:50" },
        { id: '7C', nome: 'Processamento Digital de Sinais', creditos: 4, pr: '6A', horarios: "Segunda - 11:40 às 14:50, Terça - 10:50 às 12:30" },
        { id: '7D', nome: 'Metodologia Científica', creditos: 2, pr: '162 Créditos', horarios: "Quarta - 10:50 às 12:30" }
    ],
    "8": [
        { id: '8A', nome: 'Sistemas Distribuídos', creditos: 4, pr: '3E, 5B, 5C', horarios: "Quinta - 07:00 às 10:50" },
        { id: '8B', nome: 'Microcontroladores e Sistemas Embarcados', creditos: 4, pr: '3D, 7A', horarios: "Terça - 10:50 às 12:30, Quinta - 10:50 às 12:30" },
        { id: '8C', nome: 'Sistemas Inteligentes', creditos: 3, pr: '3B, 5A, 6F', horarios: "Quarta - 10:00 às 12:30" },
        { id: '8D', nome: 'Computação Gráfica', creditos: 3, pr: '2C, 5G', horarios: "Segunda - 10:00 às 12:30" },
        { id: '8E', nome: 'Sistemas de Controle', creditos: 4, pr: '6E', horarios: "Segunda - 07:50 às 09:30, Terça - 08:40 às 10:50" }
    ],
    "9": [
        { id: '9A', nome: 'Computação de Alto Desempenho', creditos: 4, pr: '4E, 8A', horarios: "Terça - 10:50 às 12:30, Quarta - 08:40 às 10:50" },
        { id: '9B', nome: 'Trabalho de Conclusão de Curso I', creditos: 2, pr: '7D', horarios: "Terça - 07:00 às 08:40" }
    ],
    "10": [
        { id: '10A', nome: 'Trabalho de Conclusão de Curso II', creditos: 2, pr: '9B', horarios: "Terça - 07:00 às 08:40" }
    ]
};