import {
  defaultOffsets,
  describeOffsets,
  maxScheduled,
  parseOffsets,
  planReminders,
  reminderText,
  remindersFor,
} from './reminder-plan';

const now = new Date(2026, 10, 22, 12, 0); // 22 nov 2026, 12:00

describe('remindersFor', () => {
  it('avisa a las 9:00 a. m. 60, 30, 7 y 1 días antes', () => {
    const dates = remindersFor('d1', '2027-03-01', defaultOffsets, now).map((r) => r.date);
    expect(dates).toEqual([
      new Date(2026, 11, 31, 9),
      new Date(2027, 0, 30, 9),
      new Date(2027, 1, 22, 9),
      new Date(2027, 1, 28, 9),
    ]);
  });

  it('omite los avisos que ya pasaron', () => {
    // Vence en 10 días: solo quedan los avisos de 7 y 1 día.
    const offsets = remindersFor('d1', '2026-12-02', defaultOffsets, now).map((r) => r.offset);
    expect(offsets).toEqual([7, 1]);
  });

  it('el aviso de hoy a las 9:00 ya pasó si son las 12:00', () => {
    expect(remindersFor('d1', '2026-11-22', [0], now)).toEqual([]);
    expect(remindersFor('d1', '2026-11-23', [0], now)).toHaveLength(1);
  });

  it('ignora fechas inválidas', () => {
    expect(remindersFor('d1', '31/12/2026', defaultOffsets, now)).toEqual([]);
  });
});

describe('planReminders', () => {
  it('ordena por fecha y respeta el máximo', () => {
    const docs = Array.from({ length: 30 }, (_, i) => ({
      id: `d${i}`,
      expiresAt: `2027-0${(i % 9) + 1}-15`,
    }));
    const plan = planReminders(docs, defaultOffsets, now);
    expect(plan).toHaveLength(maxScheduled);
    const times = plan.map((r) => r.date.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('ajustes y textos', () => {
  it('lee los días guardados y descarta valores raros', () => {
    expect(parseOffsets(null)).toEqual(defaultOffsets);
    expect(parseOffsets('no json')).toEqual(defaultOffsets);
    expect(parseOffsets('[1, 30, 30, 5, "x"]')).toEqual([30, 1]);
    expect(parseOffsets('[]')).toEqual([]);
  });

  it('el texto nunca nombra el documento', () => {
    expect(reminderText(0)).toBe('Hoy vence uno de tus documentos.');
    expect(reminderText(1)).toBe('Mañana vence uno de tus documentos.');
    expect(reminderText(30)).toBe('Tienes un documento que vence en 30 días.');
  });

  it('describe los días elegidos', () => {
    expect(describeOffsets([60, 30, 7, 1])).toBe('60, 30, 7 y 1 días antes');
    expect(describeOffsets([7])).toBe('7 días antes');
    expect(describeOffsets([7, 0])).toBe('7 días antes y el mismo día');
    expect(describeOffsets([1])).toBe('1 día antes');
    expect(describeOffsets([0])).toBe('el mismo día');
    expect(describeOffsets([])).toBe('Sin avisos');
  });
});
