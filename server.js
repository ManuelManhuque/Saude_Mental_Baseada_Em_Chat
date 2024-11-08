// Importa as bibliotecas necessárias
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');  // Biblioteca para gerar sessionId único
const axios = require('axios');

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
        session_id TEXT,
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
            const sessionId = uuidv4();  // Gera um sessionId único
            res.json({ message: 'Login bem-sucedido', userId: row.id, sessionId });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    });
});

// Supondo que você tenha configurado um WebSocket
const socket = require('socket.io-client')('http://localhost:5005');

socket.on('connect', () => {
    console.log('Conectado ao servidor WebSocket');
});

socket.on('bot_uttered', (data) => {
    console.log('Resposta do bot:', data);
});

app.post('/send-message', (req, res) => {
    const { sessionId, message } = req.body;
    
    // Em vez de axios, use WebSocket para enviar a mensagem
    socket.emit('user_uttered', {
        sender: sessionId,
        message: message
    }, (response) => {
        // Envia a resposta do chatbot de volta ao cliente
        res.json({ botResponse: response });
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

// Rota para salvar mensagens no banco de dados com sessionId
app.post('/save-message', (req, res) => {
    const { userId, message, sender, sessionId } = req.body;
    db.run(`INSERT INTO conversations (user_id, session_id, message, sender) VALUES (?, ?, ?, ?)`, [userId, sessionId, message, sender], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao salvar mensagem' });
        res.json({ message: 'Mensagem salva com sucesso' });
    });
});

// Rota para recuperar todas as conversas de um usuário específico por sessionId
app.get('/conversations/:userId/:sessionId', (req, res) => {
    const userId = req.params.userId;
    const sessionId = req.params.sessionId;
    db.all(`SELECT * FROM conversations WHERE user_id = ? AND session_id = ?`, [userId, sessionId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao recuperar conversas' });
        res.json(rows);
    });
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
