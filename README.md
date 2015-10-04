# DepartureMonitorWien

Departure Monitor für alle Wiener Bus U-bahn und Bim Stationen

# Install

Kopiere den file config-example.js nach config.js und konfiguriere die
Portnummern für http und https. Wenn die https port Nummer -1 ist, wird
https nicht aktiviert.

Wenn https aktiviert ist, muss ein direcotory sslcert und folgende Files
erzeugt werden:

* sslcert/server.key
* sslcert/server.crt

Auf http://alext.mail.at/?p=218 kannst Du sehen wie man key und cert 
unter linux erzeugen kann.
