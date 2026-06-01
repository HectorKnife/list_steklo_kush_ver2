from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List
from scipy.integrate import solve_ivp
import numpy as np

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# Модель данных для приема запроса
class SimulationData(BaseModel):
    X0: List[float]
    norms: List[float]
    poly_coeffs: List[List[List[float]]] 
    z_coeffs: List[List[float]] 
    t_end: float = 10.0
    steps: int = 100

# Главный маршрут для отображения index.html
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

def get_poly_val(coeffs, var):
    return coeffs[0]*(var**3) + coeffs[1]*(var**2) + coeffs[2]*var + coeffs[3]

def system_dynamics(t, X, poly_coeffs, z_coeffs, norms):
    dXdt = []
    for i in range(len(X)):
        # 1. Расчет влияния полиномов
        influence = sum(get_poly_val(poly_coeffs[i][j], X[j]) for j in range(len(X)))
        disturbances = sum(get_poly_val(z_coeffs[k], t) for k in range(len(z_coeffs)))
        
        # 2. Масштабирование и демпфирование
        # Множитель 0.7 ограничивает скорость роста. 
        # Если ошибка сохраняется, уменьшай 0.7 до 0.1
        val = (0.7 / norms[i]) * (influence + disturbances)
        
        # 3. Физическое ограничение (клиппинг)
        # Если скорость слишком высокая, принудительно обрезаем её
        max_speed = 5.0 
        if val > max_speed: val = max_speed
        if val < -max_speed: val = -max_speed
            
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