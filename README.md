# Rekko

## Clonar el Repo

```
git clone https://github.com/DavidGonzalezAlvarez/Rekko.git
cd Rekko
```

## Montar el docker


```
docker-compose up --build
```

## Llenar la base de datos


```
cd database
pip install -r requirements.txt
python script.py
```
Cuanto mas tiempo este el script funcionando mas peliculas habra en la base de datos.

Una vez hecho esto para acceder a la aplicacion es en http://localhost:3000/
