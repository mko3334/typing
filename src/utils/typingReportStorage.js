import localforage from 'localforage';

const STORAGE_KEY = 'typing_reports_local';

export function isLocalTypingReportId(id) {
  return String(id || '').startsWith('local_');
}

export async function getLocalTypingReports() {
  const list = await localforage.getItem(STORAGE_KEY);
  return Array.isArray(list) ? list : [];
}

export async function addLocalTypingReport(report) {
  const list = await getLocalTypingReports();
  const next = [{ ...report }, ...list.filter((item) => item.id !== report.id)];
  await localforage.setItem(STORAGE_KEY, next);
  return report.id;
}

export async function updateLocalTypingReport(reportId, data) {
  const list = await getLocalTypingReports();
  const index = list.findIndex((item) => item.id === reportId);
  if (index < 0) return false;
  list[index] = { ...list[index], ...data };
  await localforage.setItem(STORAGE_KEY, list);
  return true;
}

export async function deleteLocalTypingReport(reportId) {
  const list = await getLocalTypingReports();
  const next = list.filter((item) => item.id !== reportId);
  await localforage.setItem(STORAGE_KEY, next);
  return next.length !== list.length;
}

export function mergeTypingReports(cloudReports, localReports) {
  const byId = new Map();
  localReports.forEach((report) => {
    if (report?.id) byId.set(report.id, report);
  });
  cloudReports.forEach((report) => {
    if (report?.id) byId.set(report.id, report);
  });
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}
