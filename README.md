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

Die "Wiener Linien - Routingservice" API benötigt keine Authentifizierung

Die "Wienerlinien Echtzeitdaten" API benötigt eine Key den man auf
https://www.data.gv.at/katalog/dataset/add66f20-d033-4eee-b9a0-47019828e698
beantragen muss.

API key für google maps (homepage.html) muss angepasst werden für mapview.
https://developers.google.com/maps/documentation/javascript/adding-a-google-map#key

# Ressourcen

Die früher verwendete API der Wiener Linie "Wiener Linien - Routingservice"
liefert zur Zeit keine Linieninformation pro Station:

http://data.wien.gv.at/pdf/wiener-linien-routing.pdf

Daher benutzt das neue System diese API:

http://data.wien.gv.at/pdf/wienerlinien-echtzeitdaten-dokumentation.pdf

