#!/bin/bash

cd frontend
npm run dev &

cd ..
.env/bin/python3 backend_py/run.py &

wait
