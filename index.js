const fs = require("fs");
const baseUrl = "http://localhost:5001/archivo/";
// Cargando el modulo de Express.js
const express = require("express");
// Cargando la librería de express-fileupload
const fileUpload = require("express-fileupload");
// Este variable define el puerto del computador donde la API esta disponible;
const PORT = 5001;
// Definimos la variable que inicializa la librería Express.js
const app = express();
// Middleware
app.use(
	fileUpload({
		createParentPath: true,
	})
);
// 1 - El puerto donde esta disponible la API
// 2 - Una función de llamada (callback) cuando la API esta lista
app.listen(PORT, () =>
	console.log(`Corriendo en el servidor, API REST subida de archivos express-fileupload que se esta ejecutando en: http: //localhost:${PORT}.`)
);

app.post("/cargadearchivo", async (req, res) => {
	// Validando la no existencia de un archivo vacío
	if (!req.files || Object.keys(req.files).length === 0) {
		res.status(400).json({
			status: false,
			message: "Archivo no subido al servidor",
			error: "400",
		});
	} else {
		//* Función del compañero Franco Contreras
		if (req.files.fileName.length > 3) {
			return res.status(400).json({
				status: false,
				message: "Solo se permite un máximo de 3 archivos en la carga",
				error: "400",
			});
		}
		const result = [];
		req.files.fileName.forEach((file) => {
			const uploadPath = "./files/" + file.name;
			//* Al fin aprendiendo usando promesas de manera coherente
			const promesa = new Promise((res, rej) => {
				if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
					res({
						file: file.name,
						code: 400,
						message: "Archivo no valido, solo .jpeg y .png",
					});
					//* Otra función robada al compañero Franco Contreras
				} else if (file.size > 1000000) {
					res({
						file: file.name,
						code: 413,
						message: "Carga útil demasiado grande (1mb)",
					});
				} else {
					file.mv(uploadPath, (err) => {
						if (err) {
							res({
								file: file.name,
								code: 418,
								message: "Soy una tetera",
							});
						}
						res({
							file: file.name,
							code: 200,
							message: "Archivo Subido al Servidor",
						});
					});
				}
			});
			result.push(promesa);
		});
		Promise.all(result).then((resultados) => {
			return res.status(200).send({
				resultados,
			});
		});
	}
});

app.get("/listadodearchivos", async (req, res) => {
	const directoryPath = "./files/";
	// El método fs.readdir() se utiliza para leer de forma
	// asíncrona el contenido de un directorio determinado.
	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			res.status(500).send({
				message: "No se puede buscar archivos en el directorio!",
			});
		}
		// Variable que contiene el listado de archivos en el servidor

		let listFiles = [];
		files.forEach((file) => {
			const fileURL = file.replaceAll(" ", "%20");
			console.log(fileURL);
			listFiles.push({
				name: file,
				url: baseUrl + fileURL,
			});
		});
		res.status(200).send(listFiles);
	});
});

app.get("/archivo/:name", async (req, res) => {
	const fileName = req.params.name;
	const directoryPath = "./files/";
	// La función res.download() transfiere el archivo en la ruta
	// como un "archivo adjunto". Por lo general, los navegadores
	// le pedirán al usuario que descargue.
	res.download(directoryPath + fileName, fileName, (err) => {
		if (err) {
			res.status(500).send({
				message: "No se puede descargar el archivo. " + err,
			});
		}
	});
});

app.delete("/archivo/:name", async (req, res) => {
	const fileName = req.params.name;
	const directoryPath = "./files/";
	let listFiles = [];
	try {
		fs.readdir(directoryPath, function (err, files) {
			if (err) {
				res.status(500).send({
					message: "No se puede buscar archivos en el directorio!",
				});
			}
			// Variable que contiene el listado de archivos en el servidor
			files.forEach((file) => {
				listFiles.push(file);
			});
			// verificamos si el archivo se encuentra en el directorio
			let fileBusqueda = listFiles.find((l) => l === fileName);
			if (!fileBusqueda) {
				return res.status(409).json({
					message: "No se encontró el archivo a eliminar en el servidor",
				});
			} else {
				// fs.unlinkSync elimina un archivo y espera hasta que se termine la
				// operación para seguir ejecutando el código, también se puede
				// usar fs.unlink() que ejecuta dicha operación de forma asíncrona
				fs.unlinkSync(directoryPath + fileName);
				console.log("Archivo Eliminado");
				res.status(200).send("Archivo Eliminado Satisfactoriamente");
			}
		});
	} catch (err) {
		console.error("ocurrió algo incorrecto al eliminar el archivo", err);
	}
});
