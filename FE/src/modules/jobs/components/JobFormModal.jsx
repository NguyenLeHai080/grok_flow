import {
  CAlert,
  CButton,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'

export default function JobFormModal({
  visible,
  saving,
  setVisible,
  save,
  selected,
  formError,
  setFormError,
  form,
  setForm,
  setModels,
  changeType,
  proxies,
  modelsForType,
  fetchProxyModels,
  defaultModelForType,
  reusableImageJobs,
  selectInputImage,
}) {
  return (
    <CModal visible={visible} onClose={() => !saving && setVisible(false)}>
      <CForm onSubmit={save}>
        <CModalHeader>
          <CModalTitle>{selected ? 'Sửa Job' : 'Tạo Job mới'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formError && <CAlert color="danger">{formError}</CAlert>}

          <CFormSelect
            className="mb-3"
            label="Loại Job"
            value={form.type}
            disabled={!!selected}
            onChange={(event) => changeType(event.target.value)}
          >
            <option value="image">Tạo ảnh</option>
            <option value="t2i">T2I - Text to Image</option>
            <option value="i2i">I2I - Image to Image</option>
            <option value="t2v">T2V - Text to Video</option>
            <option value="i2v">I2V - Image to Video</option>
            <option value="chat">Chat / Text</option>
          </CFormSelect>

          <CFormInput
            className="mb-3"
            label="Provider"
            value={form.provider}
            readOnly={['image', 't2i', 'i2i', 't2v', 'i2v'].includes(form.type)}
            onChange={(event) => setForm({ ...form, provider: event.target.value })}
            required
          />

          {!selected && (
            <CFormSelect
              className="mb-3"
              label="Proxy chạy Job"
              value={form.proxyId}
              onChange={async (event) => {
                const proxyId = event.target.value
                const proxy = proxies.find((item) => String(item.id) === proxyId)
                try {
                  const proxyModels = await fetchProxyModels(proxyId)
                  setModels(proxyModels)
                  setForm((current) => ({
                    ...current,
                    proxyId,
                    provider: proxy?.provider || current.provider,
                    model: defaultModelForType(current.type, proxyModels),
                  }))
                  setFormError('')
                } catch {
                  setModels([])
                  setFormError('Unable to load models for the selected proxy')
                }
              }}
              required
            >
              <option value="">Chọn Proxy</option>
              {proxies.map((proxy) => (
                <option key={proxy.id} value={proxy.id}>
                  {proxy.name} — {proxy.base_url}
                </option>
              ))}
            </CFormSelect>
          )}

          {!selected && (
            <CFormSelect
              className="mb-3"
              label="Model"
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
              required
            >
              {modelsForType(form.type).length === 0 && (
                <option value="">No compatible model</option>
              )}
              {modelsForType(form.type).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </CFormSelect>
          )}

          {['image', 't2i', 'i2i'].includes(form.type) && !selected && (
            <CFormSelect
              className="mb-3"
              label="Số lượng ảnh"
              value={form.count}
              onChange={(event) => setForm({ ...form, count: event.target.value })}
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count} ảnh
                </option>
              ))}
            </CFormSelect>
          )}

          {['i2i', 'i2v'].includes(form.type) && !selected && (
            <div className="mb-3">
              <CFormSelect
                className="mb-3"
                label="Use image from an existing Job"
                value={form.inputImage?.startsWith('https://') ? form.inputImage : ''}
                onChange={(event) => setForm({ ...form, inputImage: event.target.value || null })}
              >
                <option value="">Upload a new image instead</option>
                {reusableImageJobs.map(({ item, url }) => (
                  <option key={item.id} value={url}>
                    Job #{item.id} - {item.prompt.slice(0, 70)}
                  </option>
                ))}
              </CFormSelect>
              <CFormInput
                type="file"
                label="Input image"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectInputImage}
              />
              {form.inputImage && (
                <img className="job-input-preview" src={form.inputImage} alt="Input preview" />
              )}
            </div>
          )}

          {['t2i', 'i2i', 't2v', 'i2v'].includes(form.type) && !selected && (
            <CFormSelect
              className="mb-3"
              label="Aspect ratio"
              value={form.aspectRatio}
              onChange={(event) => setForm({ ...form, aspectRatio: event.target.value })}
            >
              {(form.type.includes('v')
                ? ['16:9', '9:16']
                : ['1:1', '16:9', '9:16', '4:3', '3:4']
              ).map((ratio) => (
                <option key={ratio}>{ratio}</option>
              ))}
            </CFormSelect>
          )}

          {['t2v', 'i2v'].includes(form.type) && !selected && (
            <CFormSelect
              className="mb-3"
              label="Video duration"
              value={form.duration}
              onChange={(event) => setForm({ ...form, duration: event.target.value })}
            >
              {[5, 10, 15].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} seconds
                </option>
              ))}
            </CFormSelect>
          )}

          {['image', 't2i', 'i2i', 't2v', 'i2v'].includes(form.type) && !selected && (
            <CFormCheck
              className="mb-3"
              id="enhance-image-prompt"
              label="Let Grok optimize the prompt before image generation"
              checked={form.enhancePrompt}
              onChange={(event) => setForm({ ...form, enhancePrompt: event.target.checked })}
            />
          )}

          <CFormTextarea
            className="mb-3"
            rows={6}
            label={form.type === 'image' ? 'Mô tả ảnh cần tạo' : 'Prompt'}
            placeholder={
              form.type === 'image'
                ? 'Ví dụ: Một thành phố tương lai màu tím, phong cách cinematic...'
                : 'Nhập nội dung yêu cầu...'
            }
            value={form.prompt}
            onChange={(event) => setForm({ ...form, prompt: event.target.value })}
            required
          />

          {selected && (
            <CFormSelect
              label="Status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {['pending', 'running', 'success', 'failed'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </CFormSelect>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="ghost"
            disabled={saving}
            onClick={() => setVisible(false)}
          >
            Huỷ
          </CButton>
          <CButton
            type="submit"
            color="primary"
            disabled={saving || (!selected && (!form.model || !form.proxyId))}
          >
            {saving
              ? 'Đang xử lý...'
              : selected
                ? 'Lưu thay đổi'
                : form.type === 'image'
                  ? 'Tạo và chạy ảnh'
                  : 'Tạo Job'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
