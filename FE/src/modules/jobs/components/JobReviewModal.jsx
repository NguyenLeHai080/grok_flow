import {
  CAlert,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { formatApiError } from '../../../shared/api/errors'
import StatusBadge from '../../../shared/components/StatusBadge'

export default function JobReviewModal({
  reviewing,
  setReviewing,
  reviewImages,
  reviewVideoUrl,
  parsedResult,
}) {
  return (
    <CModal size="xl" visible={!!reviewing} onClose={() => setReviewing(null)} scrollable>
      <CModalHeader>
        <CModalTitle>Review Job #{reviewing?.id}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {reviewing && (
          <div className="job-review">
            <div className="job-review-meta">
              <div>
                <span>Provider</span>
                <strong>{reviewing.provider}</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{reviewing.type}</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusBadge value={reviewing.status} />
              </div>
              <div>
                <span>Created</span>
                <strong>{new Date(reviewing.created_at).toLocaleString('vi-VN')}</strong>
              </div>
            </div>

            <section>
              <h6>Prompt</h6>
              <p className="job-review-prompt">{reviewing.prompt}</p>
            </section>

            {reviewImages(reviewing).length > 0 && (
              <section>
                <h6>Generated images</h6>
                <div className="job-review-images">
                  {reviewImages(reviewing).map((source, index) => (
                    <a key={source} href={source} target="_blank" rel="noreferrer">
                      <img src={source} alt={`${reviewing.prompt} ${index + 1}`} />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {reviewVideoUrl(reviewing) && (
              <section>
                <h6>Generated video</h6>
                <video className="job-review-video" controls src={reviewVideoUrl(reviewing)} />
              </section>
            )}

            {['t2v', 'i2v'].includes(reviewing.type) && reviewing.status === 'running' && (
              <CAlert color="info">
                Video is processing. This modal refreshes every 5 seconds.
              </CAlert>
            )}

            {reviewing.error && (
              <CAlert color="danger">
                <strong>Error:</strong> {formatApiError(reviewing.error)}
              </CAlert>
            )}

            <section>
              <h6>Raw result</h6>
              <pre>{JSON.stringify(parsedResult(reviewing), null, 2) || 'No result'}</pre>
            </section>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setReviewing(null)}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
