// Importa as bibliotecas necessárias
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

// Inicializa o servidor Express e o banco de dados SQLite persistente
const app = express();
const db = new sqlite3.Database('./database.db');  // Alterado para banco de dados persistente

// Middleware para permitir requisições de diferentes origens e tratar o corpo das requisições em JSON
app.use(cors());
app.use(bodyParser.json());

// Cria as tabelas de usuários e conversas quando o servidor é iniciado
db.serialize(() => {
    // Cria a tabela de usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    
    // Cria a tabela de conversas
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT,
        sender TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// Rota para login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro interno' });
        if (row) {
            res.json({ message: 'Login bem-sucedido', userId: row.id });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    });
});

// Rota para registrar um novo usuário
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) return res.status(400).json({ error: 'Usuário já existe' });
        res.json({ message: 'Registro bem-sucedido', userId: this.lastID });
    });
});

// Rota para obter todos os usuários - para o painel de administração
app.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar usuários' });
        res.json(rows);
    });
});

// Rota para excluir um usuário
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
        res.json({ message: 'Usuário excluído com sucesso' });
    });
});

// Rota para salvar mensagens no banco de dados
app.post('/save-message', (req, res) => {
    const { userId, message, sender } = req.body;
    db.run(`INSERT INTO conversations (user_id, message, sender) VALUES (?, ?, ?)`, [userId, message, sender], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao salvar mensagem' });
        res.json({ message: 'Mensagem salva com sucesso' });
    });
});

// Rota para recuperar todas as conversas de um usuário específico
app.get('/conversations/:userId', (req, res) => {
    const userId = req.params.userId;
    db.all(`SELECT * FROM conversations WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao recuperar conversas' });
        res.json(rows);
    });
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
