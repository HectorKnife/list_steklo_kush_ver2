from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List
from scipy.integrate import solve_ivp
import numpy as np
import pathlib

app = FastAPI()

BASE_DIR = pathlib.Path(__file__).parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

class SimulationData(BaseModel):
    X0: List[float]        # 14 начальных значений
    norms: List[float]     # 14 нормировок
    poly_coeffs: List[List[List[float]]]  # 14×14×4
    z_coeffs: List[List[float]]           # 5×4
    t_end: float = 10.0
    steps: int = 100

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )

def get_poly_val(coeffs, var):
    return coeffs[0]*(var**3) + coeffs[1]*(var**2) + coeffs[2]*var + coeffs[3]

def system_dynamics(t, X, poly_coeffs, z_coeffs, norms):
    dXdt = []
    n = len(X)  # 14
    for i in range(n):
        # Влияние полиномов
        influence = sum(get_poly_val(poly_coeffs[i][j], X[j]) for j in range(n))
        # Возмущения
        disturbances = sum(get_poly_val(z_coeffs[k], t) for k in range(len(z_coeffs)))
        
        # Масштабирование
        val = (0.7 / norms[i]) * (influence + disturbances)
        
        # Клиппинг скорости
        max_speed = 5.0
        if val > max_speed:
            val = max_speed
        if val < -max_speed:
            val = -max_speed
        
        dXdt.append(val)
    return dXdt

@app.post("/api/calculate")
async def calculate(data: SimulationData):
    try:
        t_span = (0, data.t_end)
        t_eval = np.linspace(0, data.t_end, data.steps)
        
        sol = solve_ivp(
            lambda t, X: system_dynamics(t, X, data.poly_coeffs, data.z_coeffs, data.norms),
            t_span,
            data.X0,
            t_eval=t_eval,
            method='RK45'
        )
        
        if not sol.success:
            raise HTTPException(status_code=500, detail="Ошибка интегрирования")
        
        sol.y = np.clip(sol.y, 0, 1)
        return {"time": sol.t.tolist(), "X": sol.y.tolist()}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))