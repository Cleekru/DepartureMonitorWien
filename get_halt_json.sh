#!/bin/bash

wget http://data.wien.gv.at/csv/wienerlinien-ogd-haltestellen.csv
./node_modules/.bin/csv2json -s ';' wienerlinien-ogd-haltestellen.csv halt.json
