const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Chemin des fichiers JSON
const USERS_FILE = path.join(__dirname, 'users.json');
const BUGS_FILE = path.join(__dirname, 'bugs.json');

// Créer les fichiers JSON s'ils n'existent pas
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }));
}
if (!fs.existsSync(BUGS_FILE)) {
    fs.writeFileSync(BUGS_FILE, JSON.stringify({ bugs: [] }));
}

// Routes API
app.post('/api/signup', (req, res) => {
    console.log('Requête d\'inscription reçue:', req.body);
    const { email, pseudo, password } = req.body;

    // Lire les utilisateurs existants
    const data = JSON.parse(fs.readFileSync(USERS_FILE));
    
    // Vérifier si l'email existe déjà
    if (data.users.some(user => user.email === email)) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le pseudo existe déjà
    if (data.users.some(user => user.pseudo === pseudo)) {
        return res.status(400).json({ error: 'Ce pseudo est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const newUser = {
        id: Date.now().toString(),
        email,
        pseudo,
        password // Note: En production, il faudrait hasher le mot de passe
    };

    // Ajouter le nouvel utilisateur
    data.users.push(newUser);

    // Sauvegarder dans le fichier JSON
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

    res.status(201).json({ message: 'Compte créé avec succès' });
});

app.post('/api/login', (req, res) => {
    console.log('Requête de connexion reçue:', req.body);
    const { email, password } = req.body;

    // Lire les utilisateurs
    const data = JSON.parse(fs.readFileSync(USERS_FILE));
    
    // Trouver l'utilisateur
    const user = data.users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    res.json({ 
        message: 'Connexion réussie',
        user: {
            id: user.id,
            email: user.email,
            pseudo: user.pseudo
        }
    });
});

app.post('/api/bug-report', (req, res) => {
    console.log('Requête de signalement de bug reçue:', req.body);
    const { category, description, email, pseudo } = req.body;

    if (!email || !pseudo) {
        return res.status(400).json({ error: 'Informations utilisateur manquantes' });
    }

    // Lire les bugs existants
    const data = JSON.parse(fs.readFileSync(BUGS_FILE));
    
    // Créer le nouveau signalement
    const newBug = {
        id: Date.now().toString(),
        category,
        description,
        status: 'nouveau',
        date: new Date().toISOString(),
        reportedBy: {
            email,
            pseudo
        }
    };

    console.log('Nouveau bug à enregistrer:', newBug);

    // Ajouter le nouveau signalement
    data.bugs.push(newBug);

    // Sauvegarder dans le fichier JSON
    fs.writeFileSync(BUGS_FILE, JSON.stringify(data, null, 2));

    res.status(201).json({ message: 'Signalement envoyé avec succès' });
});

// Route pour servir l'application frontend (doit être la dernière route)
app.get('*', (req, res) => {
    console.log('Requête GET reçue:', req.url);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 