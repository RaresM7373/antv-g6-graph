export default function getQuillConfig() {
  return {
    modules: {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ script: 'sub' }, { script: 'super' }],
          ['link', 'clean'],
        ],
      },
    },
    theme: 'bubble',
  };
}
