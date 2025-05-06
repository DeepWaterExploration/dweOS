from pydantic import BaseModel, Field

class PWMConfig(BaseModel):
    frequency: float = Field(..., ge=0, description="PWM frequency in Hz")
    duty_cycle: float = Field(..., description="Duty cycle as percentage (0-100)")
