from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Optional
import pathlib
import uvicorn

app = FastAPI()

BASE_DIR = pathlib.Path(__file__).parent
VARIABLE_COUNT = 13
DISTURBANCE_COUNT = 5
MAX_SPEED = 5.0
DAMPING_FACTOR = 0.7

DEFAULT_Z_EFFECTS = [
    [-1, -1, -1,  0, -1],
    [-1, -1, -1,  0, -1],
    [-1, -1,  0,  0, -1],
    [-1, -1,  0,  1, -1],
    [-1, -1,  0,  1, -1],
    [-1,  0,  0,  1, -1],
    [ 1,  0,  0,  0,  1],
    [ 0,  1,  0,  0,  0],
    [ 0,  0,  1,  0,  1],
    [ 0,  0,  0,  0,  1],
    [-1, -1, -1,  1, -1],
    [-1,  0, -1,  0, -1],
    [-1, -1, -1,  0, -1],
]

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

class SimulationData(BaseModel):
    X0: List[float]
    norms: List[float]
    poly_coeffs: List[List[List[float]]] 
    z_coeffs: List[List[float]] 
    z_effects: Optional[List[List[float]]] = None
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


def clip_speed(value: float) -> float:
    return max(-MAX_SPEED, min(MAX_SPEED, value))


def validate_data(data: SimulationData) -> None:
    if len(data.X0) != VARIABLE_COUNT:
        raise HTTPException(status_code=400, detail=f"Ожидалось {VARIABLE_COUNT} начальных параметров X.")
    if len(data.norms) != VARIABLE_COUNT or any(norm <= 0 for norm in data.norms):
        raise HTTPException(status_code=400, detail="Нормы должны быть положительными числами для всех X.")
    if len(data.poly_coeffs) != VARIABLE_COUNT or any(len(row) != VARIABLE_COUNT for row in data.poly_coeffs):
        raise HTTPException(status_code=400, detail="Матрица полиномов должна быть размером 13x13.")
    if len(data.z_coeffs) != DISTURBANCE_COUNT:
        raise HTTPException(status_code=400, detail=f"Ожидалось {DISTURBANCE_COUNT} возмущений Z.")
    if not 2 <= data.steps <= 1000:
        raise HTTPException(status_code=400, detail="Количество шагов должно быть от 2 до 1000.")
    if not 0 < data.t_end <= 100:
        raise HTTPException(status_code=400, detail="Время моделирования должно быть больше 0 и не больше 100.")


def system_dynamics(t, X, poly_coeffs, z_coeffs, norms, z_effects):
    dXdt = []
    for i in range(len(X)):
        influence = sum(get_poly_val(poly_coeffs[i][j], X[j]) for j in range(len(X)))
        disturbances = sum(
            z_effects[i][k] * get_poly_val(z_coeffs[k], t)
            for k in range(len(z_coeffs))
        )
        value = (DAMPING_FACTOR / norms[i]) * (influence + disturbances)
        dXdt.append(clip_speed(value))
    return dXdt


def add_scaled(values, derivatives, scale):
    return [value + derivative * scale for value, derivative in zip(values, derivatives)]


def clamp_state(values):
    return [max(0, min(1, value)) for value in values]


def integrate_rk4(data: SimulationData, z_effects):
    display_times = [i / (data.steps - 1) for i in range(data.steps)]
    model_times = [data.t_end * i / (data.steps - 1) for i in range(data.steps)]
    states = [clamp_state(data.X0)]

    for index, t in enumerate(model_times[:-1]):
        dt = model_times[index + 1] - t
        current = states[-1]

        k1 = system_dynamics(t, current, data.poly_coeffs, data.z_coeffs, data.norms, z_effects)
        k2 = system_dynamics(t + dt / 2, add_scaled(current, k1, dt / 2), data.poly_coeffs, data.z_coeffs, data.norms, z_effects)
        k3 = system_dynamics(t + dt / 2, add_scaled(current, k2, dt / 2), data.poly_coeffs, data.z_coeffs, data.norms, z_effects)
        k4 = system_dynamics(t + dt, add_scaled(current, k3, dt), data.poly_coeffs, data.z_coeffs, data.norms, z_effects)

        next_state = [
            value + dt * (k1_i + 2 * k2_i + 2 * k3_i + k4_i) / 6
            for value, k1_i, k2_i, k3_i, k4_i in zip(current, k1, k2, k3, k4)
        ]
        states.append(clamp_state(next_state))

    values_by_variable = [
        [state[i] for state in states]
        for i in range(VARIABLE_COUNT)
    ]
    return display_times, values_by_variable


@app.post("/api/calculate")
async def calculate(data: SimulationData):
    try:
        validate_data(data)
        z_effects = data.z_effects or DEFAULT_Z_EFFECTS
        if len(z_effects) != VARIABLE_COUNT or any(len(row) != DISTURBANCE_COUNT for row in z_effects):
            raise HTTPException(status_code=400, detail="Матрица влияния возмущений должна быть размером 13x5.")

        times, states = integrate_rk4(data, z_effects)
        return {"time": times, "X": states}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
