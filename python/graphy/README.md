# Graphy'ourData
Graphy is an end-to-end platform designed for extracting, visualizing, and analyzing large volumes of unstructured data. Without structured organization, valuable insights in such data often remain hidden. Graphy empowers users to extract predefined structures from unstructured data, organizing it into a graph format for enhanced visualization, analysis, and exploration.

![graphy](inputs/figs/graphy.png "The pipeline of Graphy")

This repository offers the first prototype of the Graphy platform, as shown in the above figure, focusing on academic papers, which are typically publicly accessible. In this scenario, the primary unstructured data consists of PDF documents of research papers. Given a paper or a zip file of multiple papers, the platform enables users to define workflows for extracting structured information from the papers using LLMs. Additionally, it provides features to fetch reference PDFs from sources like [Arxiv](./utils/arxiv_fetcher.py) and [Google Scholar](./utils/scholar_fetcher.py), allowing for the construction of a rich, interconnected database of academic papers.

With this structured database in place, various analyses can be conducted. Our [frontend server](../../examples/graphy/README.md) demonstrates data visualizations, exploration tools, and analytics that support numerous downstream tasks, including tracking research trends, drafting related work sections, and generating prompts for slide creation—all with just a few clicks.



# Install Dependencies

## Prerequisites

- Python 3.10

## Python Dependencies

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

# Run Backend Server

We have not built and installed the python package yet. So, it is important to add the path to the python package to the `PYTHONPATH` before running the server.

```bash
export PYTHONPATH=$PYTHONPATH:$(pwd)
python apps/demo_app.py
```

The server will be running on `http://localhost:9999` by default.

# Run Frontend Server
Please refer to the [frontend README](../../examples/graphy/README.md) for instructions on how to run the frontend server.

# Instruction of Backend APIs

## Dataset

### Create dataset
Create dataset from a single paper, or a zip package of multiple papers. All papers must be in PDF format. We have provided a sample `graphrag.pdf` file in the `input` directory for going through
the demo. The `dataset_id` for this paper is: `8547eb64-a106-5d09-8950-8a47fb9292dc`.

```bash
curl -X POST "http://localhost:9999/api/dataset" -F "file=@inputs/samples/graphrag.pdf"
```

### Get dataset's metadata

Get dataset's metadata by `dataset_id`, including the id, llm_config, and its workflow for extracting the paper, if configured.

```bash
curl -X GET http://0.0.0.0:9999/api/dataset?dataset_id=8547eb64-a106-5d09-8950-8a47fb9292dc
```

### Get all datasets

```bash
curl -X GET http://0.0.0.0:9999/api/dataset
```

### Delete dataset

```bash
curl -X DELETE http://0.0.0.0:9999/api/dataset/8547eb64-a106-5d09-8950-8a47fb9292dc
```

## LLM Config

### Create LLM Config

The LLM model can be configured individually for each dataset (by `dataset_id`), allowing flexibility to use different models based on specific dataset needs. For instance, if cost is a concern, a smaller or locally deployed model can be used for datasets with a large number of papers to optimize expenses.

```bash
curl -X POST http://0.0.0.0:9999/api/llm/config -H "Content-Type: application/json" -d '{
  "dataset_id": "8547eb64-a106-5d09-8950-8a47fb9292dc",
  "llm_model": "qwen-plus",
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "api_key": "xxx",
  "model_kwargs": {
    "streaming":true
  }
}'
```

We currently offer two options for configuring an LLM model:

- **Option 1: Using OpenAI-Compatible APIs**
This option supports OpenAI and other providers offering compatible APIs. To configure, provide the llm_model, base_url, api_key, and any additional model arguments. The example below demonstrates using OpenAI-compatible APIs through Alibaba’s Dashscope with the qwen-plus model.
- **Option 2: Using Locally Deployed Models with Ollama**
This option supports locally deployed LLM models through Ollama. Set llm_model to `ollama/<ollama_model_name>` to specify a model. For instance, the following settings configure the locally deployed Llama3.1 model (defaulting to 8b) from Ollama:

```bash
curl -X POST http://0.0.0.0:9999/api/llm/config -H "Content-Type: application/json" -d '{
    "dataset_id": "8547eb64-a106-5d09-8950-8a47fb9292dc",
    "llm_model": "ollama/llama3.1",
    "base_url": "http://localhost:11434",
    "model_kwargs": {
        "streaming": true
    }
}'
```


Note: If no LLM model is specified for a dataset, a default model configuration will be applied. To customize this default, open `models/__init__.py` and modify the `DEFAULT_LLM_MODEL_CONFIG` variable.


### Get the LLM Config

```bash
curl -X GET http://0.0.0.0:9999/api/llm/config?dataset_id=8547eb64-a106-5d09-8950-8a47fb9292dc
```

## Workflow Config

### Create the workflow
Create the workflow for extracting contents for all papers in the dataset. The workflow is a acyclic directed graph (RAG). The node of the workflow mainly defines what contents to extract from the paper and the output format. The edge indicates dependencies between nodes.

```bash
curl -X POST http://0.0.0.0:9999/api/dataset/workflow/config -H "Content-Type: application/json" -d '{
    "dataset_id": "8547eb64-a106-5d09-8950-8a47fb9292dc",
    "workflow_json": {
    "nodes": [
        {
            "name": "Paper"
        },
        {
            "name": "Contribution",
            "query":
                "**Question**:\nList all contributions of the paper. These contributions are always organized and listed with a head sentence like **our contributions are as follows**. For each contribution, output the **original representation** and use few words to summarize it.",
            "extract_from": ["1"],
            "output_schema": {
                "type": "array",
                "description": "A list of contributions.",
                "item": [
                    {
                        "name": "original",
                        "type": "string",
                        "description": "The original contribution sentences."
                    },
                    {
                        "name": "summary",
                        "type": "string",
                        "description": "The summary of the contribution."
                    }
                ]
            }
        },
        {
            "name": "Challenge",
            "query": "**Question**:\nPlease summarize some challenges in this paper. Each challenge has summarized NAME, detailed DESCRIPTION and SOLUTION.\n",
            "extract_from": [],
            "output_schema": {
                "type": "array",
                "description": "A list of challenges for the problems and their solutions in the paper.",
                "item": [
                    {
                        "name": "name",
                        "type": "string",
                        "description": "The summarized name of the challenge."
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "description": "The description of the challenge."
                    },
                    {
                        "name": "solution",
                        "type": "string",
                        "description": "The solution of the challenge."
                    }
                ]
            }
        }
    ],
    "edges": [
        {
            "source": "Paper",
            "target": "Contribution"
        },
        {
            "source": "Contribution",
            "target": "Challenge"
        }
    ]
  }
}'
```

### Get the Workflow

```bash
curl -X GET http://0.0.0.0:9999/api/dataset/workflow/config?dataset_id=8547eb64-a106-5d09-8950-8a47fb9292dc
```

## Extraction

Start extracting the paper contents based on the workflow.
This works asynchrously. Once started, one can call the following apis to check the progress.

```bash
curl -X POST http://0.0.0.0:9999/api/dataset/extract -H "Content-Type: application/json" -d '{
 "dataset_id": "8547eb64-a106-5d09-8950-8a47fb9292dc",
 "thread_num": 16
}'
```

Please note that in the extraction process, the `thread_num` parameter is optional, with a default value of 16.

Get the extraction status for all workflow nodes.

```bash
curl -X GET http://0.0.0.0:9999/api/dataset/extract?dataset_id=8547eb64-a106-5d09-8950-8a47fb9292dc
```

Or for a specific node

```bash
curl -X GET "http://0.0.0.0:9999/api/dataset/extract?dataset_id=8547eb64-a106-5d09-8950-8a47fb9292dc&workflow_node_names=Challenge"
```

## Graphy Your Data

After content extraction, the results can be visualized and analyzed within a graph interface. Users can export the graph data as a zip file, which can then be automatically imported and displayed in the [web-based graph visualization tool](../../examples/graphy/README.md).


```bash
curl -X POST http://0.0.0.0:9999/api/dataset/graphy -H "Content-Type: application/json" -d '{
    "dataset_id": "8547eb64-a106-5d09-8950-8a47fb9292dc"
}' --output graph.zip
```

# Tests and Benchmark

The project can be tested by running the following command:

```bash
python apps/demo_app.py  # run the backend app server
pytest --benchmark-skip -s # on other terminal
```

A benchmark tool is provided to test the workflow extraction. You can run the script from the command line as follows:

```bash
pytest --benchmark-only -s
```