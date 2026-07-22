# BNI BINGO Traffic Light Platform

## Purpose

This platform has one operational purpose: read, store, publish and present the official BNI Traffic Light Excel data for members and LT.

## Non-negotiable principles

1. Official scores and light colours always come from the uploaded Excel.
2. The website must never silently recalculate or overwrite official scores.
3. Improvement recommendations may calculate the next threshold only when the required raw fields are present.
4. When raw data is incomplete, the interface must state that a precise recommendation cannot be produced.
5. Report month is determined by the report period, not upload order.

## Users

- Members: view chapter overview, personal scores, history, precise improvement suggestions and download cards.
- LT administrators: upload, validate, publish, replace a month, add historical reports and review member trends.

## Current architecture

- Frontend: static HTML, CSS and JavaScript
- Hosting: Vercel
- Source control: GitHub
- Backend: Supabase Edge Function
- Database and file storage: Supabase

## Core files

- `index.html`: main platform
- `app.html`: production loader
- `precision_scoring.js`: precise recommendation engine
- `ux_enhancements.css`: responsive interface improvements
- `ux_enhancements.js`: LT trend and usability enhancements
- `docs/`: project knowledge and operating rules

## Release rule

Every scoring, publishing or interface change must update the relevant documentation and `DECISION_LOG.md` before the release is considered complete.
