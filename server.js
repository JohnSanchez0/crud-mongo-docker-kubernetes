const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static('.'));

const localUrl = "mongodb://nodo1:27017,nodo2:27018,nodo3:27019/?replicaSet=RP";

const dbName = 'prueba';
const collectionName = 'usuarios';

const localClient = new MongoClient(localUrl, { serverSelectionTimeoutMS: 5000 });

let localDB = null;

async function conectarBases() {
    try {
        await localClient.connect();
        localDB = localClient.db(dbName);
        console.log("Conectado a la base de datos MongoDB (Local RS)");
    } catch (err) {
        console.error("Error de conexión en base de datos local:", err.message);
    }
}

app.get('/health', (req, res) => {
    res.json({
        local: !!localDB
    });
});

app.get('/usuarios', async (req, res) => {
    if (!localDB) {
        return res.status(503).json({ error: "Base de datos no disponible" });
    }
    try {
        const usuarios = await localDB.collection(collectionName).find({}).maxTimeMS(2000).toArray();
        res.json(usuarios);
    } catch (err) {
        console.error("Error al obtener usuarios:", err);
        res.status(500).json({ error: "Error al consultar los datos de usuarios" });
    }
});

app.post('/usuarios', async (req, res) => {
    if (!localDB) {
        return res.status(503).json({ error: "Base de datos no disponible" });
    }
    const nuevoUsuario = {
        _id: new ObjectId(),
        ...req.body
    };

    try {
        await localDB.collection(collectionName).insertOne(nuevoUsuario);
        res.status(201).json({ mensaje: "Usuario creado exitosamente", local: true });
    } catch (err) {
        console.error("Error al registrar usuario:", err);
        res.status(500).json({ error: "Error al registrar el usuario en la base de datos" });
    }
});

app.put('/usuarios/:id', async (req, res) => {
    if (!localDB) {
        return res.status(503).json({ error: "Base de datos no disponible" });
    }
    const id = req.params.id;
    const { _id, ...updateData } = req.body;

    try {
        await localDB.collection(collectionName).updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        res.json({ mensaje: "Usuario actualizado exitosamente", local: true });
    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        res.status(500).json({ error: "Error al actualizar el usuario en la base de datos" });
    }
});

app.delete('/usuarios/:id', async (req, res) => {
    if (!localDB) {
        return res.status(503).json({ error: "Base de datos no disponible" });
    }
    const id = req.params.id;

    try {
        await localDB.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
        res.json({ mensaje: "Usuario eliminado exitosamente", local: true });
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        res.status(500).json({ error: "Error al eliminar el usuario de la base de datos" });
    }
});

app.listen(PORT, async () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    await conectarBases();
});