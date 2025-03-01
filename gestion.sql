CREATE TABLE Patient (
    IdPatient INT AUTO_INCREMENT NOT NULL,
    Nom VARCHAR(50) NOT NULL,
    Prenom VARCHAR(50) NOT NULL,
    DateNaissance DATE NOT NULL,
    Telephone VARCHAR(15) NOT NULL,
    Sexe ENUM('Homme','Femme') DEFAULT 'Homme',
    Nationalite VARCHAR(100),
    CONSTRAINT PK_Patient PRIMARY KEY(IdPatient)
);

CREATE TABLE Dossier (
    IdDossier INT AUTO_INCREMENT NOT NULL,
    DateCreation DATE NOT NULL,
    IdPatient INT NOT NULL,
    CONSTRAINT PK_Dossier PRIMARY KEY (IdDossier),
    CONSTRAINT FK_Patient_Dossier FOREIGN KEY(IdPatient) REFERENCES Patient(IdPatient) ON DELETE CASCADE
);

CREATE TABLE Examen (
    IdExamen INT AUTO_INCREMENT NOT NULL,
    Nom VARCHAR(50) NOT NULL,
    DateResultat DATE NOT NULL,
    Resultats VARCHAR(200) NOT NULL,
    IdDossier INT NOT NULL,
    CONSTRAINT PK_Examen PRIMARY KEY(IdExamen),
    CONSTRAINT FK_Dossier_Examen FOREIGN KEY(IdDossier) REFERENCES Dossier(IdDossier) ON DELETE CASCADE
);

CREATE TABLE Utilisateur (
    IdUtilisateur INT AUTO_INCREMENT NOT NULL,
    Prenom VARCHAR(50) NOT NULL,
    Nom VARCHAR(50) NOT NULL,
    Login VARCHAR(100) UNIQUE NOT NULL,
    MotDePasse VARCHAR(300) NOT NULL,
    CONSTRAINT PK_Utilisateur PRIMARY KEY(IdUtilisateur)
    ); 