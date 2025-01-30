const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// Configuration de la base de données
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bd_node_project'
});
db.connect(err => {
    if (err) throw err;
    console.log('Base de données connectée');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

function isAuthenticated(req, res, next) {
    if (req.session && req.session.utilisateurId) {
        return next();
    } else {
        res.redirect('/connexion');
    }
}

// Route par défaut pour rediriger vers la page de connexion
app.get('/', (req, res) => {
    res.redirect('/connexion');
});

// Route d'inscription
app.get('/inscription', (req, res) => {
    res.render('inscription');
});
// Route d'inscription
app.post('/inscription', (req, res) => {
    const { prenom, nom, login, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;
        const sql = 'INSERT INTO Utilisateur (Prenom, Nom, Login, MotDePasse) VALUES (?, ?, ?, ?)';
        db.query(sql, [prenom, nom, login, hash], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('Cette adresse e-mail est déjà utilisée.');
                }
                throw err;
            }
            res.redirect('/utilisateurs');
        });
    });
});

// Route de connexion
app.get('/connexion', (req, res) => {
    res.render('connexion');
});
app.post('/connexion', (req, res) => {
    const { login, password } = req.body;
    const sql = 'SELECT * FROM Utilisateur WHERE Login = ?';
    db.query(sql, [login], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.MotDePasse, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    req.session.utilisateurId = user.IdUtilisateur;
                    res.redirect('/dashboard');
                } else {
                    res.status(401).send('Mot de passe incorrect');
                }
            });
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    });
});

// Route pour afficher le tableau de bord
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard');
});

// Route de déconnexion
app.get('/deconnexion', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/connexion');
    });
});

// Route pour afficher la liste des utilisateurs
app.get('/utilisateurs', isAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM Utilisateur';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('utilisateurs', { utilisateurs: results });
    });
});

// Route pour afficher le formulaire de modification d'un utilisateur
app.get('/modifier-utilisateur/:id', isAuthenticated, (req, res) => {
    const utilisateurId = req.params.id;
    const sql = 'SELECT * FROM Utilisateur WHERE IdUtilisateur = ?';
    db.query(sql, [utilisateurId], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.render('modifier-utilisateur', { utilisateur: results[0] });
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    });
});

// Route de modification d'utilisateur avec vérification de l'ID
app.post('/modifier-utilisateur', isAuthenticated, (req, res) => {
    const { id, prenom, nom, login, password } = req.body;
    const checkSql = 'SELECT * FROM Utilisateur WHERE IdUtilisateur = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) throw err;
                const updateSql = 'UPDATE Utilisateur SET Prenom = ?, Nom = ?, Login = ?, MotDePasse = ? WHERE IdUtilisateur = ?';
                db.query(updateSql, [prenom, nom, login, hash, id], (err, result) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).send('Cette adresse e-mail est déjà utilisée.');
                        }
                        throw err;
                    }
                    res.redirect('/utilisateurs');
                });
            });
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    });
});

// Route de suppression d'utilisateur avec vérification de l'ID
app.post('/supprimer-utilisateur', isAuthenticated, (req, res) => {
    const { id } = req.body;
    const checkSql = 'SELECT * FROM Utilisateur WHERE IdUtilisateur = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const deleteSql = 'DELETE FROM Utilisateur WHERE IdUtilisateur = ?';
            db.query(deleteSql, [id], (err, result) => {
                if (err) throw err;
                res.redirect('/utilisateurs');
            });
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    });
});

// Route d'affichage des patients
app.get('/patients', isAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM Patient';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('patients', { patients: results });
    });
});

// Route d'ajout de patient
app.post('/ajouter-patient', isAuthenticated, (req, res) => {
    const { nom, prenom, dateNaissance, telephone, sexe, nationalite } = req.body;
    const sql = 'INSERT INTO Patient (Nom, Prenom, DateNaissance, Telephone, Sexe, Nationalite) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nom, prenom, dateNaissance, telephone, sexe, nationalite], (err, result) => {
        if (err) throw err;
        res.redirect('/patients');
    });
});

// Route pour afficher le formulaire de modification d'un patient
app.get('/modifier-patient/:id', isAuthenticated, (req, res) => {
    const patientId = req.params.id;
    const sql = 'SELECT * FROM Patient WHERE IdPatient = ?';
    db.query(sql, [patientId], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.render('modifier-patient', { patient: results[0] });
        } else {
            res.status(404).send('Patient non trouvé');
        }
    });
});

// Route pour traiter la modification d'un patient
app.post('/modifier-patient', isAuthenticated, (req, res) => {
    const { id, nom, prenom, dateNaissance, telephone, sexe, nationalite } = req.body;
    const sql = 'UPDATE Patient SET Nom = ?, Prenom = ?, DateNaissance = ?, Telephone = ?, Sexe = ?, Nationalite = ? WHERE IdPatient = ?';
    db.query(sql, [nom, prenom, dateNaissance, telephone, sexe, nationalite, id], (err, result) => {
        if (err) throw err;
        res.redirect('/patients');
    });
});

// Route de suppression de patient avec vérification de l'ID
app.post('/supprimer-patient', isAuthenticated, (req, res) => {
    const { id } = req.body;
    const checkSql = 'SELECT * FROM Patient WHERE IdPatient = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const deleteSql = 'DELETE FROM Patient WHERE IdPatient = ?';
            db.query(deleteSql, [id], (err, result) => {
                if (err) throw err;
                res.redirect('/patients');
            });
        } else {
            res.status(404).send('Patient non trouvé');
        }
    });
});

// Routes similaires pour Dossier et Examen
// Route pour afficher la page de gestion des dossiers
app.get('/dossiers', isAuthenticated, (req, res) => {
    const sqlDossiers = 'SELECT * FROM Dossier';
    const sqlPatients = 'SELECT * FROM Patient';
    
    db.query(sqlDossiers, (err, dossiersResults) => {
        if (err) throw err;
        db.query(sqlPatients, (err, patientsResults) => {
            if (err) throw err;
            res.render('dossiers', { dossiers: dossiersResults, patients: patientsResults });
        });
    });
});

// Route pour ajouter un dossier
app.post('/ajouter-dossier', isAuthenticated, (req, res) => {
    const { dateCreation, idPatient } = req.body;
    const sql = 'INSERT INTO Dossier (DateCreation, IdPatient) VALUES (?, ?)';
    db.query(sql, [dateCreation, idPatient], (err, result) => {
        if (err) throw err;
        res.redirect('/dossiers');
    });
});

// Route pour modifier un dossier
app.get('/modifier-dossier/:id', isAuthenticated, (req, res) => {
    const dossierId = req.params.id;
    const sqlDossier = 'SELECT * FROM Dossier WHERE IdDossier = ?';
    const sqlPatients = 'SELECT * FROM Patient';
    
    db.query(sqlDossier, [dossierId], (err, dossierResults) => {
        if (err) throw err;
        if (dossierResults.length > 0) {
            db.query(sqlPatients, (err, patientResults) => {
                if (err) throw err;
                res.render('modifier-dossier', { dossier: dossierResults[0], patients: patientResults });
            });
        } else {
            res.status(404).send('Dossier non trouvé');
        }
    });
});

// Route pour traiter la modification d'un dossier
app.post('/modifier-dossier', isAuthenticated, (req, res) => {
    const { id, dateCreation, idPatient } = req.body;
    const sql = 'UPDATE Dossier SET DateCreation = ?, IdPatient = ? WHERE IdDossier = ?';
    db.query(sql, [dateCreation, idPatient, id], (err, result) => {
        if (err) throw err;
        res.redirect('/dossiers');
    });
});

// Route de suppression de dossier avec vérification de l'ID
app.post('/supprimer-dossier', isAuthenticated, (req, res) => {
    const { id } = req.body;
    const checkSql = 'SELECT * FROM Dossier WHERE IdDossier = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const deleteSql = 'DELETE FROM Dossier WHERE IdDossier = ?';
            db.query(deleteSql, [id], (err, result) => {
                if (err) throw err;
                res.redirect('/dossiers');
            });
        } else {
            res.status(404).send('Dossier non trouvé');
        }
    });
});

// Route pour afficher la page de gestion des examens
app.get('/examens', isAuthenticated, (req, res) => {
    const sqlExamens = 'SELECT * FROM Examen';
    const sqlDossiers = 'SELECT * FROM Dossier';
    
    db.query(sqlExamens, (err, examensResults) => {
        if (err) throw err;
        db.query(sqlDossiers, (err, dossiersResults) => {
            if (err) throw err;
            res.render('examens', { examens: examensResults, dossiers: dossiersResults });
        });
    });
});

// Route pour ajouter un examen
app.post('/ajouter-examen', isAuthenticated, (req, res) => {
    const { nomExamen, dateResultat, resultat, idDossier } = req.body;
    const sql = 'INSERT INTO Examen (Nom, DateResultat, Resultats, IdDossier) VALUES (?, ?, ?, ?)';
    db.query(sql, [nomExamen, dateResultat, resultat, idDossier], (err, result) => {
        if (err) throw err;
        res.redirect('/examens');
    });
});

// Route pour modifier un examen
app.get('/modifier-examen/:id', isAuthenticated, (req, res) => {
    const examenId = req.params.id;
    const sqlExamen = 'SELECT * FROM Examen WHERE IdExamen = ?';
    const sqlDossiers = 'SELECT * FROM Dossier';
    
    db.query(sqlExamen, [examenId], (err, examenResults) => {
        if (err) throw err;
        if (examenResults.length > 0) {
            db.query(sqlDossiers, (err, dossiersResults) => {
                if (err) throw err;
                res.render('modifier-examen', { examen: examenResults[0], dossiers: dossiersResults });
            });
        } else {
            res.status(404).send('Examen non trouvé');
        }
    });
});

app.post('/modifier-examen', isAuthenticated, (req, res) => {
    const { id, nomExamen, dateResultat, resultat, idDossier } = req.body;
    const sql = 'UPDATE Examen SET Nom = ?, DateResultat = ?, Resultats = ?, IdDossier = ? WHERE IdExamen = ?';
    db.query(sql, [nomExamen, dateResultat, resultat, idDossier, id], (err, result) => {
        if (err) throw err;
        res.redirect('/examens');
    });
});

// Route de suppression d'examen avec vérification de l'ID
app.post('/supprimer-examen', isAuthenticated, (req, res) => {
    const { id } = req.body;
    const checkSql = 'SELECT * FROM Examen WHERE IdExamen = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const deleteSql = 'DELETE FROM Examen WHERE IdExamen = ?';
            db.query(deleteSql, [id], (err, result) => {
                if (err) throw err;
                res.redirect('/examens');
            });
        } else {
            res.status(404).send('Examen non trouvé');
        }
    });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});