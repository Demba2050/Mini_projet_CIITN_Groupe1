const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3050;

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bd_node_project'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to database');
});

// Liste de révocation des jetons
let revokedTokens = [];

// Middleware pour vérifier si le jeton est révoqué
const checkRevokedToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (revokedTokens.includes(token)) {
        return res.status(401).json({ message: 'Token révoqué' });
    }
    next();
};

// Routes pour les patients
app.get("/patients", checkRevokedToken, (req, res) => {
    const sql = "SELECT * FROM Patient";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post("/patients-add", checkRevokedToken, (req, res) => {
    const { nom, prenom, dateNaissance, telephone, sexe, nationalite } = req.body;
    const sql = 'INSERT INTO Patient (Nom, Prenom, DateNaissance, Telephone, Sexe, Nationalite) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nom, prenom, dateNaissance, telephone, sexe, nationalite], (err, result) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de l\'ajout du patient' });
        res.json({ message: 'Patient ajouté avec succès', id: result.insertId });
    });
});

app.put('/patients/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const { nom, prenom, dateNaissance, telephone, sexe, nationalite } = req.body;
    const checkSql = 'SELECT * FROM Patient WHERE IdPatient = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification du patient' });
        if (results.length === 0) return res.status(404).json({ message: 'Patient non trouvé' });

        const sql = 'UPDATE Patient SET Nom = ?, Prenom = ?, DateNaissance = ?, Telephone = ?, Sexe = ?, Nationalite = ? WHERE IdPatient = ?';
        db.query(sql, [nom, prenom, dateNaissance, telephone, sexe, nationalite, id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la mise à jour du patient' });
            res.json({ message: 'Patient mis à jour avec succès' });
        });
    });
});

app.delete('/patients/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const checkSql = 'SELECT * FROM Patient WHERE IdPatient = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification du patient' });
        if (results.length === 0) return res.status(404).json({ message: 'Patient non trouvé' });

        const sql = 'DELETE FROM Patient WHERE IdPatient = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la suppression du patient' });
            res.json({ message: 'Patient supprimé avec succès' });
        });
    });
});

// Routes pour les dossiers
app.get("/dossiers", checkRevokedToken, (req, res) => {
    const sql = "SELECT * FROM Dossier";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post("/dossiers-add", checkRevokedToken, (req, res) => {
    const { dateCreation, idPatient } = req.body;
    const sql = 'INSERT INTO Dossier (DateCreation, IdPatient) VALUES (?, ?)';
    db.query(sql, [dateCreation, idPatient], (err, result) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de l\'ajout du dossier' });
        res.json({ message: 'Dossier ajouté avec succès', id: result.insertId });
    });
});

app.put('/dossiers/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const { dateCreation, idPatient } = req.body;
    const checkSql = 'SELECT * FROM Dossier WHERE IdDossier = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification du dossier' });
        if (results.length === 0) return res.status(404).json({ message: 'Dossier non trouvé' });

        const sql = 'UPDATE Dossier SET DateCreation = ?, IdPatient = ? WHERE IdDossier = ?';
        db.query(sql, [dateCreation, idPatient, id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la mise à jour du dossier' });
            res.json({ message: 'Dossier mis à jour avec succès' });
        });
    });
});

app.delete('/dossiers/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const checkSql = 'SELECT * FROM Dossier WHERE IdDossier = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification du dossier' });
        if (results.length === 0) return res.status(404).json({ message: 'Dossier non trouvé' });

        const sql = 'DELETE FROM Dossier WHERE IdDossier = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la suppression du dossier' });
            res.json({ message: 'Dossier supprimé avec succès' });
        });
    });
});

// Routes pour les examens
app.get("/examens", checkRevokedToken, (req, res) => {
    const sql = "SELECT * FROM Examen";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post("/examens-add", checkRevokedToken, (req, res) => {
    const { nom, dateResultat, resultats, idDossier } = req.body;
    const sql = 'INSERT INTO Examen (Nom, DateResultat, Resultats, IdDossier) VALUES (?, ?, ?, ?)';
    db.query(sql, [nom, dateResultat, resultats, idDossier], (err, result) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'examen' });
        res.json({ message: 'Examen ajouté avec succès', id: result.insertId });
    });
});

app.put('/examens/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const { nom, dateResultat, resultats, idDossier } = req.body;
    const checkSql = 'SELECT * FROM Examen WHERE IdExamen = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'examen' });
        if (results.length === 0) return res.status(404).json({ message: 'Examen non trouvé' });

        const sql = 'UPDATE Examen SET Nom = ?, DateResultat = ?, Resultats = ?, IdDossier = ? WHERE IdExamen = ?';
        db.query(sql, [nom, dateResultat, resultats, idDossier, id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'examen' });
            res.json({ message: 'Examen mis à jour avec succès' });
        });
    });
});

app.delete('/examens/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const checkSql = 'SELECT * FROM Examen WHERE IdExamen = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'examen' });
        if (results.length === 0) return res.status(404).json({ message: 'Examen non trouvé' });

        const sql = 'DELETE FROM Examen WHERE IdExamen = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la suppression de l\'examen' });
            res.json({ message: 'Examen supprimé avec succès' });
        });
    });
});

// Routes pour les utilisateurs
app.get("/utilisateurs", checkRevokedToken, (req, res) => {
    const sql = "SELECT * FROM Utilisateur";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post("/utilisateurs-add", async (req, res) => {
    const { prenom, nom, login, motDePasse } = req.body;

    // Validation de la longueur du mot de passe
    if (motDePasse.length < 8 || motDePasse.length > 20) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir entre 8 et 20 caractères' });
    }

    const checkSql = 'SELECT * FROM Utilisateur WHERE Login = ?';
    db.query(checkSql, [login], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'utilisateur' });
        if (results.length > 0) return res.status(400).json({ message: 'Email déjà existant' });

        const hashedPassword = await bcrypt.hash(motDePasse, 10);
        const sql = 'INSERT INTO Utilisateur (Prenom, Nom, Login, MotDePasse) VALUES (?, ?, ?, ?)';
        db.query(sql, [prenom, nom, login, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'utilisateur' });
            res.json({ message: 'Utilisateur ajouté avec succès', id: result.insertId });
        });
    });
});

app.put('/utilisateurs/:id', async (req, res) => {
    const { id } = req.params;
    const { prenom, nom, login, motDePasse } = req.body;

    // Validation de la longueur du mot de passe
    if (motDePasse.length < 8 || motDePasse.length > 20) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir entre 8 et 20 caractères' });
    }

    const checkSql = 'SELECT * FROM Utilisateur WHERE IdUtilisateur = ?';
    db.query(checkSql, [id], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'utilisateur' });
        if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const checkEmailSql = 'SELECT * FROM Utilisateur WHERE Login = ? AND IdUtilisateur != ?';
        db.query(checkEmailSql, [login, id], async (err, emailResults) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });
            if (emailResults.length > 0) return res.status(400).json({ message: 'Email déjà existant' });

            const hashedPassword = await bcrypt.hash(motDePasse, 10);
            const sql = 'UPDATE Utilisateur SET Prenom = ?, Nom = ?, Login = ?, MotDePasse = ? WHERE IdUtilisateur = ?';
            db.query(sql, [prenom, nom, login, hashedPassword, id], (err, result) => {
                if (err) return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
                res.json({ message: 'Utilisateur mis à jour avec succès' });
            });
        });
    });
});

app.delete('/utilisateurs/:id', checkRevokedToken, (req, res) => {
    const { id } = req.params;
    const checkSql = 'SELECT * FROM Utilisateur WHERE IdUtilisateur = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'utilisateur' });
        if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const sql = 'DELETE FROM Utilisateur WHERE IdUtilisateur = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
            res.json({ message: 'Utilisateur supprimé avec succès' });
        });
    });
});

// Route de connexion
app.post('/login', (req, res) => {
    const { login, motDePasse } = req.body;
    const sql = 'SELECT * FROM Utilisateur WHERE Login = ?';
    db.query(sql, [login], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la vérification de l\'utilisateur' });
        if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const user = results[0];
        const isMatch = await bcrypt.compare(motDePasse, user.MotDePasse);
        if (!isMatch) return res.status(400).json({ message: 'Identifiant ou mot de passe incorrect' });

        const token = jwt.sign({ id: user.IdUtilisateur }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ message: 'Connexion réussie', token });
    });
});

// Route de déconnexion
app.post('/logout', (req, res) => {
    const token = req.headers['authorization'];
    revokedTokens.push(token);
    res.json({ message: 'Déconnexion réussie' });
});

// Route pour obtenir les informations d'un patient et ses examens
app.get('/patients/:id/information', (req, res) => {
    const { id } = req.params;
    const sqlPatient = 'SELECT * FROM Patient WHERE IdPatient = ?';
    const sqlDossier = 'SELECT * FROM Dossier WHERE IdPatient = ?';
    const sqlExamens = 'SELECT * FROM Examen WHERE IdDossier IN (SELECT IdDossier FROM Dossier WHERE IdPatient = ?)';

    db.query(sqlPatient, [id], (err, patientResults) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la récupération du patient' });
        if (patientResults.length === 0) return res.status(404).json({ message: 'Patient non trouvé' });

        db.query(sqlDossier, [id], (err, dossierResults) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la récupération du dossier' });
            if (dossierResults.length === 0) return res.status(404).json({ message: 'Dossier non trouvé' });

            const dossier = dossierResults[0];

            db.query(sqlExamens, [id], (err, examenResults) => {
                if (err) return res.status(500).json({ message: 'Erreur lors de la récupération des examens' });

                dossier.Examens = examenResults;
                res.json(dossier);
            });
        });
    });
});

// Route pour obtenir les informations d'un dossier et ses examens
app.get('/dossiers/:id/information', (req, res) => {
    const { id } = req.params;
    const sqlDossier = 'SELECT * FROM Dossier WHERE IdDossier = ?';
    const sqlExamens = 'SELECT * FROM Examen WHERE IdDossier = ?';

    db.query(sqlDossier, [id], (err, dossierResults) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la récupération du dossier' });
        if (dossierResults.length === 0) return res.status(404).json({ message: 'Dossier non trouvé' });

        db.query(sqlExamens, [id], (err, examenResults) => {
            if (err) return res.status(500).json({ message: 'Erreur lors de la récupération des examens' });

            const dossier = dossierResults[0];
            dossier.Examens = examenResults;
            res.json(dossier);
        });
    });
});

// Route pour obtenir les informations d'un examen
app.get('/examens/:id/information', (req, res) => {
    const { id } = req.params;
    const sqlExamen = 'SELECT * FROM Examen WHERE IdExamen = ?';

    db.query(sqlExamen, [id], (err, examenResults) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la récupération de l\'examen' });
        if (examenResults.length === 0) return res.status(404).json({ message: 'Examen non trouvé' });

        res.json(examenResults[0]);
    });
});


app.listen(port, () => {
    console.log(`Le serveur fonctionne sur le port ${port}`);
});