import { useEffect, useState } from 'react'
import { CAlert } from '@coreui/react'
import ConfirmDialog from '../../shared/components/ConfirmDialog'
import PageHeader from '../../shared/components/PageHeader'
import useResource from '../../shared/hooks/useResource'
import http from '../../shared/api/http'
import { formatApiError } from '../../shared/api/errors'
import JobFormModal from './components/JobFormModal'
import JobReviewModal from './components/JobReviewModal'
import JobsTable from './components/JobsTable'
import './jobs.scss'

const emptyForm = {
  proxyId: '',
  provider: 'xai',
  type: 't2i',
  model: 'grok-imagine-image-quality',
  prompt: '',
  count: 1,
  enhancePrompt: false,
  inputImage: null,
  aspectRatio: '1:1',
  resolution: '1k',
  duration: 5,
  status: 'pending',
}

export default function JobsPage() {
  const { items, loading, error, load } = useResource('/jobs')
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [models, setModels] = useState([])
  const [proxies, setProxies] = useState([])
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [reviewing, setReviewing] = useState(null)

  const modelsForType = (type, source = models) =>
    source.filter((model) => {
      const id = model.id.toLowerCase()
      if (type === 'i2i') return id.includes('imagine-image') && id.includes('edit')
      if (['image', 't2i'].includes(type))
        return id.includes('imagine-image') && !id.includes('edit')
      if (type === 't2v') return id.startsWith('grok-imagine-video')
      if (type === 'i2v') return id.startsWith('grok-imagine-video')
      return !id.includes('imagine-image') && !id.includes('imagine-video')
    })

  const defaultModelForType = (type, source = models) => {
    const availableModels = modelsForType(type, source)
    if (['image', 't2i', 'i2i'].includes(type)) {
      return (
        availableModels.find((model) => model.id === 'grok-imagine-image-quality')?.id ||
        availableModels[0]?.id ||
        ''
      )
    }
    if (['t2v', 'i2v'].includes(type)) {
      const preferredModel = 'grok-imagine-video'
      return (
        availableModels.find((model) => model.id === preferredModel)?.id ||
        availableModels[0]?.id ||
        ''
      )
    }
    return availableModels[0]?.id || ''
  }

  const fetchProxyModels = async (proxyId) => {
    if (!proxyId) return []
    const { data } = await http.get(`/proxies/${proxyId}/models`)
    return data
  }

  const open = async (item = null) => {
    setSelected(item)
    setFormError('')
    if (item) {
      setForm({
        ...emptyForm,
        provider: item.provider,
        type: item.type,
        prompt: item.prompt,
        status: item.status,
      })
      setVisible(true)
      return
    }

    try {
      const { data: proxyData } = await http.get('/proxies')
      const activeProxies = proxyData.filter((proxy) => proxy.is_active)
      const initialProxy = activeProxies[0]
      const modelData = await fetchProxyModels(initialProxy?.id)
      setModels(modelData)
      setProxies(activeProxies)
      setForm({
        ...emptyForm,
        proxyId: initialProxy?.id || '',
        provider: initialProxy?.provider || emptyForm.provider,
        model: defaultModelForType('t2i', modelData),
      })
    } catch {
      setModels([{ id: 'grok-imagine-image-quality', owned_by: 'xai' }])
      setProxies([])
      setForm(emptyForm)
    }
    setVisible(true)
  }

  const changeType = (type) => {
    setForm((current) => ({
      ...current,
      type,
      model: defaultModelForType(type),
    }))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    let createdJobId = null
    try {
      if (!form.model) {
        throw new Error('The selected proxy does not support this job type')
      }
      let generatedJob = null
      const payload = {
        provider: form.provider,
        type: form.type,
        prompt: form.prompt,
        status: selected ? form.status : 'pending',
      }

      if (selected) {
        await http.put(`/jobs/${selected.id}`, payload)
      } else {
        const { data: createdJob } = await http.post('/jobs', payload)
        createdJobId = createdJob.id
        if (['t2i', 'i2i', 't2v', 'i2v'].includes(form.type)) {
          const { data } = await http.post(
            `/jobs/${createdJob.id}/run-media`,
            {
              proxy_id: Number(form.proxyId),
              mode: form.type,
              model: form.model,
              count: Number(form.count),
              input_image: form.inputImage,
              aspect_ratio: form.aspectRatio,
              resolution: form.resolution,
              duration: Number(form.duration),
              enhance_prompt: form.enhancePrompt,
            },
            { timeout: 360000 },
          )
          generatedJob = data
        } else if (form.type === 'chat') {
          const { data } = await http.post(`/jobs/${createdJob.id}/run`, {
            proxy_id: Number(form.proxyId),
            model: form.model,
          })
          generatedJob = data
        }
      }

      setVisible(false)
      if (generatedJob) setReviewing(generatedJob)
      load()
    } catch (requestError) {
      if (createdJobId && requestError.response) {
        await http.delete(`/jobs/${createdJobId}`).catch(() => undefined)
      }
      const detail = formatApiError(requestError)
      setFormError(
        typeof detail === 'string'
          ? detail
          : requestError.code === 'ECONNABORTED'
            ? 'Grok xử lý quá lâu. Job vẫn có thể đang chạy; hãy đóng modal và kiểm tra danh sách Jobs.'
            : 'Không thể lưu hoặc chạy Job',
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    await http.delete(`/jobs/${deleting.id}`)
    setDeleting(null)
    load()
  }

  const retry = async (id) => {
    await http.post(`/jobs/${id}/retry`)
    load()
  }

  const runImage = async (id) => {
    const { data: retryJob } = await http.post(`/jobs/${id}/retry`)
    await http.post(`/jobs/${retryJob.id}/run-image`, {
      model: 'grok-imagine-image-quality',
      count: 1,
      response_format: 'url',
      enhance_prompt: true,
    })
    load()
  }

  const imageUrl = (item) => {
    if (!['image', 't2i', 'i2i'].includes(item.type) || !item.result) return null
    try {
      return JSON.parse(item.result)?.data?.[0]?.url || null
    } catch {
      return null
    }
  }

  const parsedResult = (item) => {
    if (!item?.result) return null
    try {
      return JSON.parse(item.result)
    } catch {
      return item.result
    }
  }

  const cacheBustedImageUrl = (url, jobId) => {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}groks_job=${jobId}`
  }

  const reusableImageJobs = items
    .map((item) => ({ item, url: imageUrl(item) }))
    .filter(({ url }) => Boolean(url))

  const reviewImages = (item) => {
    const result = parsedResult(item)
    if (!result || typeof result !== 'object' || !Array.isArray(result.data)) return []
    return result.data
      .map((entry, index) => {
        const source =
          entry.url || (entry.b64_json ? `data:image/png;base64,${entry.b64_json}` : null)
        return source ? cacheBustedImageUrl(source, `${item.id}_${index}`) : null
      })
      .filter(Boolean)
  }

  const reviewVideoUrl = (item) => {
    const result = parsedResult(item)
    if (!result || typeof result !== 'object') return null
    return result.video_url || result.video?.url || null
  }

  useEffect(() => {
    if (!reviewing || !['t2v', 'i2v'].includes(reviewing.type) || reviewing.status !== 'running') {
      return undefined
    }
    const timer = window.setInterval(async () => {
      try {
        const { data } = await http.post(`/jobs/${reviewing.id}/refresh-media`)
        setReviewing(data)
        load()
      } catch {
        window.clearInterval(timer)
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [load, reviewing])

  const selectInputImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setFormError('Input image must be JPEG, PNG, or WebP and no larger than 10 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, inputImage: reader.result }))
    reader.readAsDataURL(file)
  }

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Tạo và theo dõi tác vụ Chat hoặc tạo ảnh bằng Grok."
        action={() => open()}
        actionLabel="Thêm Job"
      />
      {error && <CAlert color="danger">{error}</CAlert>}

      <JobsTable
        loading={loading}
        items={items}
        imageUrl={imageUrl}
        cacheBustedImageUrl={cacheBustedImageUrl}
        onReview={setReviewing}
        onRetry={retry}
        onRunImage={runImage}
        onEdit={open}
        onDelete={setDeleting}
      />
      <JobFormModal
        visible={visible}
        saving={saving}
        setVisible={setVisible}
        save={save}
        selected={selected}
        formError={formError}
        form={form}
        setForm={setForm}
        setModels={setModels}
        setFormError={setFormError}
        changeType={changeType}
        proxies={proxies}
        modelsForType={modelsForType}
        fetchProxyModels={fetchProxyModels}
        defaultModelForType={defaultModelForType}
        reusableImageJobs={reusableImageJobs}
        selectInputImage={selectInputImage}
      />
      <JobReviewModal
        reviewing={reviewing}
        setReviewing={setReviewing}
        reviewImages={reviewImages}
        reviewVideoUrl={reviewVideoUrl}
        parsedResult={parsedResult}
      />

      <ConfirmDialog
        visible={!!deleting}
        message={`Xoá job #${deleting?.id}?`}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  )
}
