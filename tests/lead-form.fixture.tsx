import React from 'react'
import { createRoot } from 'react-dom/client'
import { LeadForm } from '../src/components/agenticweb/lead-form'

createRoot(document.getElementById('root')!).render(<LeadForm channel="form:qa" steps={[
  { id: 'name', title: 'Identitate', fields: [{ name: 'name', label: 'Nume', required: true }] },
  { id: 'contact', title: 'Contact', fields: [{ name: 'email', label: 'Email', type: 'email', required: true }] },
]} />)
