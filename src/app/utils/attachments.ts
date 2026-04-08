import { AttachmentItem } from '../context/AppContext';

const bundledAttachmentUrls: Record<string, string> = {
  'TM QHPK THI TRAN BEN DAU.pdf': '/documents/TM%20QHPK%20THI%20TRAN%20BEN%20DAU.pdf',
};

function triggerBrowserDownload(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getBundledAttachmentUrl(fileName: string) {
  return bundledAttachmentUrls[fileName];
}

export function downloadAttachment(file: AttachmentItem) {
  const resolvedUrl = file.fileUrl ?? getBundledAttachmentUrl(file.fileName);

  if (resolvedUrl) {
    triggerBrowserDownload(resolvedUrl, file.fileName);
    return;
  }

  const fallbackContent = [
    `Attachment: ${file.fileName}`,
    `Uploaded: ${file.lastUploadDate || 'Unknown'}`,
    '',
    'This demo workspace stores attachment metadata only.',
  ].join('\n');

  const blob = new Blob([fallbackContent], { type: 'application/octet-stream' });
  const objectUrl = URL.createObjectURL(blob);
  triggerBrowserDownload(objectUrl, file.fileName);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
