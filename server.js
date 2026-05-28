const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static('.'));

const localUrl = process.env.MONGODB_URI || "mongodb://nodo1:27017,nodo2:27018,nodo3:27019/?replicaSet=RP";

const dbName = process.env.MONGODB_DB || 'prueba';
const collectionName = process.env.MONGODB_COLLECTION || 'usuarios';

const localClient = new MongoClient(localUrl, { serverSelectionTimeoutMS: 5000 });

let localDB = null;

async function conectarBases() {
    let retries = 15;
    while (retries > 0) {
        try {
            await localClient.connect();
            localDB = localClient.db(dbName);
            console.log("Conectado a la base de datos MongoDB (Local RS)");
            return; // Conexión exitosa
        } catch (err) {
            console.error(`Error de conexión en base de datos local. Reintentos restantes: ${retries - 1}. Error: ${err.message}`);
            retries -= 1;
            if (retries === 0) {
                console.error("No se pudo establecer conexión con la base de datos después de múltiples reintentos.");
            } else {
                await new Promise(res => setTimeout(res, 5000)); // Esperar 5 segundos antes de reintentar
            }
        }
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

    const { nombre, email, edad } = req.body;
    if (!nombre || !email) {
        return res.status(400).json({ error: "Los campos 'nombre' y 'email' son obligatorios." });
    }

    const nuevoUsuario = {
        _id: new ObjectId(),
        nombre,
        email,
        edad
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

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "El ID proporcionado no tiene un formato válido." });
    }

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

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "El ID proporcionado no tiene un formato válido." });
    }

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