---
_schema: default
date: 2026-04-18T00:00:00Z
location: Home
vehicle: 2025 Mach-E GT
energy_kwh: 15
cost: 0
notes:
_inputs:
  date:
    type: date
  location:
    type: select
    options:
      values:
        - Home
        - Work
        - Tesla, Lansing
        - Tesla, Ohio
        - Tesla, Battle Creek
        - ChargePoint, Muskegon
        - ChargePoint, Clare, MI
        - ChargePoint, Grand Rapids, MI
        - ChargePoint, DIA, Detroit
        - Rivian, Clare, MI
        - MGM Grand, Detroit, MI
        - Blink, BJ's Wholesale, Canton
        - Paul & Carol's, Beulah, MI
  energy_kwh:
    type: number
    comment: Energy added in kWh
  cost:
    type: number
    comment: Total cost in USD
  notes:
    type: textarea
---
