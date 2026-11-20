# MediRed IPS · Aplicación web (Módulo 3)

Redes y Servicios Multimedia · UAO · Grupo 1, jornada diurna.

Aplicación web de MediRed IPS (clínica con sedes en Bogotá, Cali y Medellín) construida con
microservicios REST organizados en capas. Se despliega sobre el ambiente del Módulo 2:
servidor1 (DNS + MySQL) y servidor2 (Apache como API Gateway + microservicios).

## Integrantes

| Integrante | Usuario de GitHub | Microservicio a cargo | Roles semana 1 |
|---|---|---|---|
| Alejandro González | auchija | ms-citas | Integrador, Documentador |
| Sebastián Montaño Reyes | Sebastian-Montano | ms-pacientes, ms-medicos | Arquitecto |
| Miguel Ángel Jiménez | Chanclaxx | ms-historias | Coordinador, Relator |

## Microservicios

| Microservicio | Entidad | Responsable | Puerto | Referencia a |
|---|---|---|---|---|
| ms-usuarios | Usuario | Docente | 3001 | — |
| ms-pacientes | Paciente | Sebastián Montaño Reyes | 3002 | — |
| ms-medicos | Médico | Sebastián Montaño Reyes | 3003 | — |
| ms-citas | Cita | Alejandro González | 3004 | Pacientes, Médicos |
| ms-historias | Historia clínica | Miguel Ángel Jiménez | 3005 | Pacientes, Médicos |

## Estructura del repositorio

- `ms-usuarios/`: entregado por la docente, nadie lo modifica.
- `ms-<recurso>/`: un microservicio por integrante; cada uno trabaja solo en su carpeta.
- `frontend/`: interfaz web (desde la semana 2).
- `deploy/`: archivos de despliegue en servidor1 y servidor2 (Taller 3).

## Reglas del grupo

1. Hacer pull antes de empezar a trabajar.
2. Cada integrante modifica solo la carpeta de su microservicio.
3. Commits pequeños y frecuentes, con mensajes del tipo `ms-citas: agrega validación de fecha`.
4. El README principal y el `.gitignore` de la raíz los edita solo el integrador.
5. Nunca subir `node_modules` ni `.env`. Todos los datos son ficticios.

## Despliegue en el ambiente (Taller 3)

Pasos para desplegar la aplicación completa en las dos VMs, en el mismo orden en que se hizo.
Las contraseñas y la `JWT_SECRET` **no** están en el repositorio: cada vez que aparezca `<clave>`
se escribe una clave nueva, solo con letras y números.

| Equipo | IP | Qué corre | Puertos abiertos en ufw |
|---|---|---|---|
| servidor1 | 172.16.1.210 | bind9 (zona `medired.com.co`) y MySQL 8.0 | 22, 53 y 3306 solo desde 172.16.1.211 |
| servidor2 | 172.16.1.211 | Apache (gateway + frontend) y los 5 microservicios en `127.0.0.1:3001-3005` | 22 y 80 |

Al final la aplicación queda en **http://app.medired.com.co** y cada ruta `/api/<recurso>` llega a su microservicio.

> Si una VM se queda en `Loading essential drivers` y `vagrant up` termina con *Timed out*,
> poner en el Vagrantfile `config.vm.provider "virtualbox" do |vb| vb.cpus = 1; vb.memory = 2048 end`
> y ejecutar `vagrant reload`.

### 1. MySQL en servidor1

```bash
sudo apt update && sudo apt install -y mysql-server
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
#   bind-address = 127.0.0.1,172.16.1.210        (sin espacio después de la coma)
sudo systemctl restart mysql
sudo ufw allow from 172.16.1.211 to any port 3306 proto tcp
sudo ss -tlnp | grep 3306                        # debe aparecer 172.16.1.210:3306
```

### 2. Bases de datos y usuarios (servidor1)

Los comandos están en [`deploy/bases-de-datos.sql`](deploy/bases-de-datos.sql). Se copia el archivo,
se cambia cada `<clave>` y se ejecuta con `sudo mysql < bases-de-datos.sql`. Cada usuario queda
restringido a `@'172.16.1.211'` y solo tiene permisos sobre su base.

```bash
sudo mysql -e "SELECT user, host FROM mysql.user WHERE user LIKE '%\_user'"   # los 5 usuarios con 172.16.1.211
```

### 3. Preparar servidor2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git mysql-client
sudo add-apt-repository -y ppa:dotnet/backports && sudo apt install -y aspnetcore-runtime-10.0   # para ms-pacientes y ms-medicos
sudo adduser --system --group --no-create-home nodeapps
sudo chmod o+x /srv/medired          # la carpeta viene del Módulo 2 con permisos 750
sudo mkdir -p /srv/medired/app && sudo chown vagrant:vagrant /srv/medired/app
git clone https://github.com/auchija/medired-diurno-g1.git /srv/medired/app
```

### 4. Tablas en servidor1, creadas desde servidor2

Cada uno con el `db/schema.sql` de su microservicio (así se prueba además que el usuario solo entra desde servidor2):

```bash
cd /srv/medired/app/ms-historias
mysql -h 172.16.1.210 -u historias_user -p historias_db < db/schema.sql
mysql -h 172.16.1.210 -u historias_user -p historias_db -e "SELECT * FROM historias"
```

Igual para `ms-usuarios` (`usuarios_db`), `ms-pacientes`, `ms-medicos` y `ms-citas`.

### 5. Microservicios en Node.js (ms-usuarios primero, luego ms-citas y ms-historias)

```bash
cd /srv/medired/app/ms-historias
npm ci --omit=dev
cp .env.example .env && nano .env
chmod 640 .env && sudo chgrp nodeapps .env
```

Solo cambia el `.env`, el código es el mismo del Taller 2:

| Variable | En el PC (Taller 2) | En servidor2 (Taller 3) |
|---|---|---|
| `PORT`, `HOST` | el puerto del servicio, `127.0.0.1` | igual |
| `DB_HOST` | `localhost` | `172.16.1.210` |
| `DB_NAME`, `DB_USER` | `<recurso>_db`, `<recurso>_user` | igual |
| `DB_PASSWORD` | la de desarrollo | la nueva de servidor1 |
| `JWT_SECRET` | la del grupo para desarrollo | una nueva de al menos 32 caracteres, **la misma en los 5 servicios** |
| `PACIENTES_URL`, `MEDICOS_URL` | `http://127.0.0.1:3002` y `:3003` | igual |

La `JWT_SECRET` debe tener **32 caracteres o más**: los servicios .NET rechazan con 401 los tokens firmados con una clave más corta.

### 6. Microservicios en .NET (ms-pacientes y ms-medicos)

Se publican en el PC y se copian a servidor2 por la carpeta compartida `/vagrant`:

```powershell
dotnet publish ms-pacientes -c Release -o <carpeta del Vagrantfile>\publish\ms-pacientes
dotnet publish ms-medicos   -c Release -o <carpeta del Vagrantfile>\publish\ms-medicos
```

```bash
sudo mkdir -p /srv/medired/publish && sudo chown vagrant:vagrant /srv/medired/publish
cp -r /vagrant/publish/ms-pacientes /vagrant/publish/ms-medicos /srv/medired/publish/
```

La configuración de producción va en `appsettings.Production.json` dentro de cada carpeta publicada
(permisos 640 y grupo nodeapps, igual que el `.env`):

```json
{
  "Host": "127.0.0.1",
  "Port": 3002,
  "ConnectionStrings": {
    "Pacientes": "Server=172.16.1.210;Port=3306;Database=pacientes_db;User ID=pacientes_user;Password=<clave>;"
  },
  "Jwt": { "Secret": "<la misma JWT_SECRET de los servicios en Node>" }
}
```

Para ms-medicos: `"Port": 3003` y la cadena `"Medicos"` con `medicos_db` y `medicos_user`.

### 7. Servicios systemd

Los archivos están en [`deploy/`](deploy/) (uno por microservicio, con `User=nodeapps` y `Restart=on-failure`):

```bash
sudo cp /srv/medired/app/deploy/ms-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias
systemctl status ms-historias                  # active (running)
journalctl -u ms-historias -n 20               # mensajes y errores del servicio
for p in 3001 3002 3003 3004 3005; do curl -s http://127.0.0.1:$p/health; echo; done
sudo ss -tlnp | grep 300                       # todos en 127.0.0.1:300X
```

### 8. Registro DNS en servidor1

En `/etc/bind/db.medired.com.co` se agrega la línea siguiente y se incrementa el serial:

```
app     IN      A       172.16.1.211
```

```bash
sudo named-checkzone medired.com.co /etc/bind/db.medired.com.co
sudo systemctl reload named
```

### 9. Gateway y frontend en servidor2

```bash
sudo a2enmod proxy proxy_http
sudo cp /srv/medired/app/deploy/app.conf /etc/apache2/sites-available/app.conf
sudo a2ensite app.conf
sudo apache2ctl configtest                     # Syntax OK
sudo systemctl reload apache2
sudo mkdir -p /var/www/app && sudo cp -r /srv/medired/app/frontend/* /var/www/app/
```

| Ruta pública | Destino interno |
|---|---|
| `/api/usuarios` | `http://127.0.0.1:3001/usuarios` |
| `/api/pacientes` | `http://127.0.0.1:3002/pacientes` |
| `/api/medicos` | `http://127.0.0.1:3003/medicos` |
| `/api/citas` | `http://127.0.0.1:3004/citas` |
| `/api/historias` | `http://127.0.0.1:3005/historias` |

### 10. Contraseña del administrador y un usuario por rol

Con el gateway funcionando: `PUT /api/usuarios/1` con el JSON completo y el campo `password` nuevo
(la contraseña inicial de `admin@empresa.com` la conoce todo el curso), y `POST /api/usuarios` para
crear un usuario `medico` y uno `admisiones`.

### 11. Comprobaciones desde Windows

En el adaptador de VirtualBox de la red 172.16.1.0/24, el DNS preferido debe ser `172.16.1.210`.

```powershell
nslookup app.medired.com.co                    # 172.16.1.211
Test-NetConnection 172.16.1.210 -Port 3306     # TcpTestSucceeded : False
curl.exe -m 5 http://172.16.1.211:3005/health  # falla: los microservicios solo escuchan en 127.0.0.1
```

Luego se abre http://app.medired.com.co y se inicia sesión con un usuario de cada rol. Las colecciones
de Postman del Taller 2 se ejecutan con `base` y `usuarios` en `http://app.medired.com.co/api`.

### Actualizar un microservicio después de un cambio en GitHub

```bash
cd /srv/medired/app && git pull
cd ms-historias && npm ci --omit=dev
sudo systemctl restart ms-historias
sudo cp -r /srv/medired/app/frontend/* /var/www/app/     # si cambió el frontend
```

### Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `git clone` da *Permission denied* en `/srv/medired/app` | `/srv/medired` viene del Módulo 2 con permisos 750 | `sudo chmod o+x /srv/medired` |
| `vagrant ssh` pide contraseña | la llave privada la pueden leer otros usuarios de Windows | dejar la llave solo para el usuario (`icacls <llave> /inheritance:r /grant:r "%USERNAME%:R"`) |
| Los servicios .NET responden 401 con un token válido | `JWT_SECRET` de menos de 32 caracteres | usar una clave de 32 o más, la misma en todos |
| `Access denied` de MySQL desde servidor2 | clave distinta o usuario creado con otro origen | revisar `SELECT user, host FROM mysql.user` y recrear el usuario |
| El gateway responde 503 en `/api/<recurso>` | ese microservicio está detenido | `systemctl status ms-<recurso>` y `journalctl -u ms-<recurso>` |
