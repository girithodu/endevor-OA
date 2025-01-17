import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import RevenueChart from './components/RevenueChart'
import VolumeChart from './components/VolumeChart'

function App() {
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    unit_cost: '',
    price_best: '',
    price_max: ''
  })
  const [responseData, setResponseData] = useState(null)

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
    
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key])
    })

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()
      setResponseData(data)
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
                <div className="space-y-4">
                  <div>
                    <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700">
                      Unit Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="unit_cost"
                      id="unit_cost"
                      value={formData.unit_cost}
                      onChange={handleInputChange}
                      placeholder="Enter unit cost"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="price_best" className="block text-sm font-medium text-gray-700">
                      Best Price
                    </label>
                    <input
                      type="number"
                      name="price_best"
                      id="price_best"
                      value={formData.price_best}
                      onChange={handleInputChange}
                      placeholder="Enter best price"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="price_max" className="block text-sm font-medium text-gray-700">
                      Maximum Price
                    </label>
                    <input
                      type="number"
                      name="price_max"
                      id="price_max"
                      value={formData.price_max}
                      onChange={handleInputChange}
                      placeholder="Enter maximum price"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      required
                    />
                  </div>
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

      {/* Results Section */}
      {responseData && (
        <div className="mt-8 max-w-4xl mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">Optimal Price</h3>
                <p className="text-2xl font-bold text-indigo-600">${responseData.optimal_price}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  ${responseData.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">Total Profit</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  ${responseData.total_profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            {/* Revenue and Profit Chart */}
            <RevenueChart monthlyData={responseData.monthly_data} />
            
            {/* Volume Chart */}
            <VolumeChart monthlyData={responseData.monthly_data} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
