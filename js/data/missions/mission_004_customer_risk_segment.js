import { ANALYSIS_TYPE, MISSION_DIFFICULTY, MISSION_PRIORITY, MISSION_VISIBILITY } from '../../domain/missions/missionTypes.js';

export const MISSION_004_ID = 'mission_004_customer_risk_segment';
export const MISSION_004_WEEK_WINDOW = {
  start: '2026-04-06',
  end: '2026-04-12'
};

export const mission004CustomerRiskSegment = {
  id: MISSION_004_ID,
  version: 1,
  title: 'Segmento con mayor revenue en riesgo',
  summary: 'Cruzar pedidos y maestro de clientes para detectar qué segmento concentra más importe pendiente o cancelado.',
  category: 'marketing_analytics',
  analysisType: ANALYSIS_TYPE.MARKETING_ANALYSIS,
  difficulty: MISSION_DIFFICULTY.MID,
  priority: MISSION_PRIORITY.HIGH,
  ambiguity: 'medium',
  initiallyUnlocked: false,
  visibilityMode: MISSION_VISIBILITY.HIDDEN_UNTIL_UNLOCKED,
  prerequisites: ['mission_002_web_category_mix', 'mission_003_ops_risk_region'],
  stakeholder: {
    id: 'nico_ortega',
    name: 'Nicolás Ortega',
    role: 'Líder de Marketing'
  },
  schedule: {
    dayLabel: 'Martes',
    hourLabel: '09:20',
    deadlineHours: 3,
    deadlineLabel: 'Hoy 12:20 · Revisión de retención',
    weekWindow: { ...MISSION_004_WEEK_WINDOW }
  },
  objective: 'Determinar qué segmento de clientes concentra más revenue en riesgo durante la semana.',
  narrative: 'Marketing y operaciones necesitan priorizar una acción de retención. El export de pedidos no contiene el segmento, por lo que debes enriquecerlo con el maestro de clientes antes de comparar exposición.',
  business_goal: 'Priorizar el segmento que requiere una intervención de retención por importe pendiente o cancelado.',
  analytical_goal: 'Relacionar sales_clean con customers por customer_id, mantener el corte semanal, filtrar estados de riesgo y agrupar por customer_segment.',
  pressureNote: 'No alcanza con contar pedidos: el comité quiere saber dónde está concentrado el importe económico expuesto.',
  executiveAudience: 'Mesa de crecimiento y retención',
  starterQuery: `SELECT
  c.customer_segment,
  SUM(s.amount) AS at_risk_revenue,
  COUNT(*) AS issue_orders
FROM sales_clean AS s
JOIN customers AS c
  ON c.customer_id = s.customer_id
WHERE s.sale_date >= '2026-04-06'
  AND s.sale_date <= '2026-04-12'
  AND s.status_norm IN ('pending', 'cancelled')
GROUP BY c.customer_segment
ORDER BY at_risk_revenue DESC;`,
  datasets: [
    {
      id: 'sales_dirty_csv',
      name: 'sales_dirty.csv',
      type: 'csv',
      role: 'primary',
      label: 'Export de pedidos con customer_id',
      status: 'Pendiente de normalización',
      path: 'data/mission_004_customer_risk_segment/raw/sales_dirty.csv',
      loadMode: 'required'
    },
    {
      id: 'customers_csv',
      name: 'customers.csv',
      type: 'csv',
      role: 'supporting',
      tableName: 'customers',
      label: 'Maestro de clientes y segmentos',
      status: 'Tabla auxiliar para JOIN',
      path: 'data/mission_004_customer_risk_segment/raw/customers.csv',
      loadMode: 'required'
    }
  ],
  context: {
    files: ['brief_customer_risk_segment.md'],
    notes: [
      'Revenue en riesgo incluye pedidos pending y cancelled.',
      'El segmento solo está disponible en customers.csv.'
    ],
    attachments: [
      {
        id: 'sales_dirty_csv',
        name: 'sales_dirty.csv',
        type: 'csv',
        label: 'Export de pedidos',
        status: 'Disponible al aceptar',
        path: 'data/mission_004_customer_risk_segment/raw/sales_dirty.csv'
      },
      {
        id: 'customers_csv',
        name: 'customers.csv',
        type: 'csv',
        label: 'Maestro de clientes',
        status: 'Disponible al aceptar',
        path: 'data/mission_004_customer_risk_segment/raw/customers.csv'
      },
      {
        id: 'mission_json',
        name: 'mission.json',
        type: 'json',
        label: 'Brief de misión',
        status: 'Contexto de retención',
        path: 'data/mission_004_customer_risk_segment/mission.json'
      },
      {
        id: 'schema_json',
        name: 'schema.json',
        type: 'json',
        label: 'Analysis schema',
        status: 'Relaciones y columnas',
        path: 'data/mission_004_customer_risk_segment/schema.json'
      }
    ]
  },
  deliverables: {
    sql: { required: true, targetTable: 'sales_clean', primaryMetric: 'at_risk_revenue' },
    chart: { required: true, allowedTypes: ['bar', 'column'], preferredType: 'bar' },
    executiveSummary: { required: true, minLength: 56 }
  },
  validation: {
    rules: [
      { type: 'sql_uses_table', table: 'sales_clean', severity: 'hard' },
      { type: 'sql_joins_table', table: 'customers', severity: 'hard' },
      { type: 'sql_has_group_by', severity: 'hard' },
      { type: 'sql_uses_sum', severity: 'hard' },
      { type: 'sql_filters_week_window', start: MISSION_004_WEEK_WINDOW.start, end: MISSION_004_WEEK_WINDOW.end, severity: 'hard' },
      { type: 'sql_mentions_all_values', field: 'status_norm', values: ['pending', 'cancelled'], severity: 'hard' },
      { type: 'result_matches_winner', fieldCandidates: ['customer_segment', 'segment'], expected: 'Mid-Market', severity: 'hard' },
      { type: 'report_metric_matches', expected: 'at_risk_revenue', severity: 'soft' },
      { type: 'report_chart_type', expected: 'bar', severity: 'soft' },
      { type: 'report_conclusion_mentions', expectedAny: ['mid-market', 'retención', 'riesgo'], severity: 'soft' }
    ]
  },
  scoring: {
    weights: {
      technical: 0.55,
      reporting: 0.25,
      businessCommunication: 0.2
    },
    thresholds: { excellent: 90, solid: 75, acceptable: 60 },
    deltas: { success: { prestige: 22, score: 13 }, failure: { prestige: -3, score: 1 } }
  },
  expectedAnswer: { customerSegment: 'Mid-Market' },
  rewards: {
    prestige: 22,
    technicalScore: 13,
    unlockSkills: ['sql_joins', 'customer_segmentation', 'risk_revenue_analysis']
  },
  outcomes: {
    excellent: 'approved_clean',
    solid: 'approved',
    acceptable: 'approved_with_notes',
    poor: 'revision_requested'
  },
  followups: []
};
