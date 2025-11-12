const { useEffect, useMemo, useRef, useState } = React;

const translations = {
  zh: {
    title: '高级文件上传器',
    description: '选择多个文件并查看实时上传进度。所有文件上传完成后，可在下方查看详细信息。',
    uploadButton: '上传文件',
    progressTitle: '上传进度',
    progressStatus: '正在上传…',
    tableTitle: '上传完成的文件',
    tableHeaders: {
      name: '文件名',
      size: '大小',
      created: '创建日期',
      modified: '修改日期',
      actions: '操作',
    },
    pagination: {
      previous: '上一页',
      next: '下一页',
    },
    operations: {
      remove: '移除',
    },
    emptyState: '暂无已上传的文件。',
    pageIndicator: (current, total) => `第 ${current} / ${total} 页`,
  },
  en: {
    title: 'Advanced File Uploader',
    description:
      'Select multiple files and monitor their upload progress. Once finished, review the file details below.',
    uploadButton: 'Upload Files',
    progressTitle: 'Upload Progress',
    progressStatus: 'Uploading…',
    tableTitle: 'Uploaded Files',
    tableHeaders: {
      name: 'File Name',
      size: 'Size',
      created: 'Created',
      modified: 'Modified',
      actions: 'Actions',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
    },
    operations: {
      remove: 'Remove',
    },
    emptyState: 'No files have been uploaded yet.',
    pageIndicator: (current, total) => `Page ${current} of ${total}`,
  },
};

const PAGE_SIZE = 5;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  return `${size.toFixed(size >= 10 || size === Math.floor(size) ? 0 : 1)} ${units[exponent]}`;
};

function App() {
  const [language, setLanguage] = useState('zh');
  const [uploads, setUploads] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);
  const uploadControllers = useRef({});

  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const t = translations[language];

  const formatDate = (value) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  };

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return uploadedFiles.slice(start, start + PAGE_SIZE);
  }, [currentPage, uploadedFiles]);

  const totalPages = Math.max(1, Math.ceil(uploadedFiles.length / PAGE_SIZE));

  useEffect(() => {
    return () => {
      Object.values(uploadControllers.current).forEach((intervalId) => {
        clearInterval(intervalId);
      });
    };
  }, []);

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const newUploads = files.map((file, index) => ({
      id: `${timestamp}-${index}-${file.name}`,
      file,
      progress: 0,
      status: 'uploading',
      createdAt: new Date(),
      modifiedAt: new Date(file.lastModified || Date.now()),
    }));

    setUploads((previous) => [...previous, ...newUploads]);

    newUploads.forEach((upload) => {
      const interval = setInterval(() => {
        setUploads((currentUploads) => {
          const updatedUploads = currentUploads.map((item) => {
            if (item.id !== upload.id) {
              return item;
            }

            const increment = Math.random() * 18 + 7;
            const nextProgress = Math.min(100, item.progress + increment);
            const completed = nextProgress >= 100;

            if (completed) {
              clearInterval(uploadControllers.current[upload.id]);
              delete uploadControllers.current[upload.id];

              setUploadedFiles((prevUploaded) => {
                const alreadyExists = prevUploaded.some((fileItem) => fileItem.id === upload.id);
                if (alreadyExists) {
                  return prevUploaded;
                }
                const updated = [
                  ...prevUploaded,
                  {
                    id: upload.id,
                    name: upload.file.name,
                    size: upload.file.size,
                    createdAt: upload.createdAt,
                    modifiedAt: upload.modifiedAt,
                  },
                ];
                const pages = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
                setCurrentPage(pages);
                return updated;
              });
            }

            return {
              ...item,
              progress: nextProgress,
              status: completed ? 'completed' : 'uploading',
            };
          });

          return updatedUploads.filter((item) => item.status !== 'completed');
        });
      }, 350 + Math.random() * 250);

      uploadControllers.current[upload.id] = interval;
    });

    event.target.value = '';
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((file) => file.id !== id);
      const pages = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
      if (currentPage > pages) {
        setCurrentPage(pages);
      }
      return updated;
    });
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>{t.title}</h1>
          <p className="app__description">{t.description}</p>
        </div>
        <div className="app__language-select">
          <label htmlFor="language-select" className="sr-only">
            Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            aria-label="Select language"
          >
            <option value="zh">中文简体</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <section className="app__uploader">
        <button type="button" className="primary-button" onClick={handleUploadButtonClick}>
          {t.uploadButton}
        </button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          multiple
          onChange={handleFilesSelected}
        />
      </section>

      {uploads.length > 0 && (
        <section className="app__progress" aria-live="polite">
          <h2>{t.progressTitle}</h2>
          <ul>
            {uploads.map((item) => (
              <li key={item.id}>
                <div className="progress-item__header">
                  <span className="progress-item__name" title={item.file.name}>
                    {item.file.name}
                  </span>
                  <span className="progress-item__percent">{Math.round(item.progress)}%</span>
                </div>
                <div className="progress-bar" role="progressbar" aria-valuenow={Math.round(item.progress)}>
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${item.progress}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className="progress-item__status">{t.progressStatus}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="app__table">
        <h2>{t.tableTitle}</h2>
        {uploadedFiles.length === 0 ? (
          <p className="app__empty">{t.emptyState}</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t.tableHeaders.name}</th>
                    <th scope="col">{t.tableHeaders.size}</th>
                    <th scope="col">{t.tableHeaders.created}</th>
                    <th scope="col">{t.tableHeaders.modified}</th>
                    <th scope="col">{t.tableHeaders.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFiles.map((file) => (
                    <tr key={file.id}>
                      <td data-label={t.tableHeaders.name}>{file.name}</td>
                      <td data-label={t.tableHeaders.size}>{formatFileSize(file.size)}</td>
                      <td data-label={t.tableHeaders.created}>{formatDate(file.createdAt)}</td>
                      <td data-label={t.tableHeaders.modified}>{formatDate(file.modifiedAt)}</td>
                      <td data-label={t.tableHeaders.actions}>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleRemoveFile(file.id)}
                        >
                          {t.operations.remove}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uploadedFiles.length > PAGE_SIZE && (
              <div className="pagination">
                <button type="button" onClick={handlePreviousPage} disabled={currentPage === 1}>
                  {t.pagination.previous}
                </button>
                <span>{t.pageIndicator(currentPage, totalPages)}</span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  {t.pagination.next}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
