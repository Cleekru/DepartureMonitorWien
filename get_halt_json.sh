#!/bin/bash

wget -O wienerlinien-ogd-haltestellen.csv https://data.wien.gv.at/csv/wienerlinien-ogd-haltestellen.csv
./node_modules/.bin/csv2json -s ';' wienerlinien-ogd-haltestellen.csv halt.json

wget -O wienerlinien-ogd-steige.csv https://data.wien.gv.at/csv/wienerlinien-ogd-steige.csv
./node_modules/.bin/csv2json -s ';' wienerlinien-ogd-steige.csv steige.json

