import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

function App() {
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    // Add more fields as needed
  })

  const onDrop = useCallback(acceptedFiles => {
    setFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      alert('Please select a file')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('file', file)
    
    // Append other form fields
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key])
    })

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()
      console.log('Success:', data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400">
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p className="text-center text-gray-600">Drop the file here...</p>
                  ) : (
                    <p className="text-center text-gray-600">
                      Drag 'n' drop a CSV or Excel file here, or click to select
                    </p>
                  )}
                  {file && (
                    <p className="mt-2 text-sm text-gray-600">Selected file: {file.name}</p>
                  )}
                </div>

                {/* Form Fields */}
                <div>
                  <input
                    type="text"
                    name="field1"
                    value={formData.field1}
                    onChange={handleInputChange}
                    placeholder="Field 1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="field2"
                    value={formData.field2}
                    onChange={handleInputChange}
                    placeholder="Field 2"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upload and Process
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
